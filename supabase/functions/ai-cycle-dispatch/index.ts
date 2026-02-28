import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { buildGoalRiskContext, buildMonthlyReviewContext, buildSpendingAnomalyContext } from "../_shared/context.ts";
import { asErrorMessage } from "../_shared/errors.ts";
import { getEnv } from "../_shared/env.ts";
import { callGemini, parseModelJson } from "../_shared/gemini.ts";
import { getMonthBoundsForDate, getPeriodForFunction, getTodayIso } from "../_shared/period.ts";
import { buildPrompt } from "../_shared/prompts.ts";
import { claimRun, finishRun } from "../_shared/run-lock.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { countMonthlyAiInsights, storeFallbackRuleInsight, storeInsightAndDeliveries } from "../_shared/store.ts";
import type { DispatchResult, InsightFunctionType, PromptVersion, TriggerSource } from "../_shared/types.ts";
import { AI_FUNCTION_TYPES } from "../_shared/types.ts";

type DispatchRequest = {
  functionType: InsightFunctionType;
  triggerSource?: TriggerSource;
  schedulerJobId?: string;
};

const PRIORITY: Record<InsightFunctionType, number> = {
  monthly_review: 1,
  goal_risk_coach: 2,
  spending_anomaly_explainer: 3,
};

function jsonResponse(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function normalizeFunctionType(value: unknown): InsightFunctionType | null {
  if (typeof value !== "string") return null;
  return (AI_FUNCTION_TYPES as readonly string[]).includes(value) ? (value as InsightFunctionType) : null;
}

function isCapExceeded(functionType: InsightFunctionType, currentMonthCount: number): boolean {
  if (currentMonthCount >= 6) return true;

  // Reserve one slot for higher-priority runs: monthly and goal coach.
  if (functionType === "spending_anomaly_explainer" && currentMonthCount >= 5) return true;

  return false;
}

function toFlatText(functionType: InsightFunctionType, modelJson: Record<string, unknown>): {
  title: string;
  recommendation: string;
  contentText: string;
  confidence: "high" | "medium" | "low";
} {
  if (functionType === "monthly_review") {
    const title = typeof modelJson.title === "string" ? modelJson.title : "Tổng kết tài chính tháng";
    const summary = typeof modelJson.summary === "string"
      ? modelJson.summary
      : "Đây là tổng kết tài chính tháng dựa trên dữ liệu hiện có.";

    const wins = Array.isArray(modelJson.wins)
      ? modelJson.wins.filter((item): item is string => typeof item === "string").slice(0, 2)
      : [];
    const risks = Array.isArray(modelJson.risks)
      ? modelJson.risks.filter((item): item is string => typeof item === "string").slice(0, 2)
      : [];

    const action = typeof modelJson.action === "string"
      ? modelJson.action
      : "Tuần này, dành 30 phút cùng đối tác để chốt một khoản cắt giảm chi tiêu biến đổi.";

    const contentText = [
      summary,
      wins.length ? `Điểm tích cực: ${wins.join("; ")}` : "",
      risks.length ? `Điểm cần chú ý: ${risks.join("; ")}` : "",
      `Hành động tuần này: ${action}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    return { title, recommendation: action, contentText, confidence: "medium" };
  }

  if (functionType === "goal_risk_coach") {
    const title = typeof modelJson.title === "string" ? modelJson.title : "Rủi ro tiến độ mục tiêu";
    const riskReason = typeof modelJson.risk_reason === "string"
      ? modelJson.risk_reason
      : "Tốc độ đóng góp gần đây thấp hơn mức cần thiết để kịp hạn.";
    const impact = typeof modelJson.impact === "string"
      ? modelJson.impact
      : "Nếu giữ nhịp hiện tại, thời điểm hoàn thành có thể bị dời.";
    const action = typeof modelJson.action === "string"
      ? modelJson.action
      : "Tuần này, tăng đóng góp vào mục tiêu cao rủi ro nhất theo mức thiếu hụt bình quân tháng.";

    const contentText = `${riskReason}\n\nTác động: ${impact}\n\nHành động tuần này: ${action}`;

    return { title, recommendation: action, contentText, confidence: "medium" };
  }

  const title = typeof modelJson.title === "string" ? modelJson.title : "Bất thường chi tiêu biến đổi";
  const whatChanged = typeof modelJson.what_changed === "string"
    ? modelJson.what_changed
    : "Chi tiêu biến đổi đang cao hơn nền gần đây.";

  const drivers = Array.isArray(modelJson.drivers)
    ? modelJson.drivers.filter((item): item is string => typeof item === "string").slice(0, 2)
    : [];

  const action = typeof modelJson.action === "string"
    ? modelJson.action
    : "Tuần này, đặt trần chi tiêu cho nhóm biến đổi cao nhất và theo dõi theo ngày.";

  const contentText = [
    whatChanged,
    drivers.length ? `Nguyên nhân khả dĩ: ${drivers.join("; ")}` : "",
    `Hành động tuần này: ${action}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { title, recommendation: action, contentText, confidence: "medium" };
}

async function loadActivePromptVersion(client: ReturnType<typeof createServiceClient>, functionType: InsightFunctionType) {
  const result = await client
    .from("ai_prompt_versions")
    .select("id, function_type, version, role_frame, task_instruction, output_contract, guardrails")
    .eq("function_type", functionType)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? `Missing active prompt version for ${functionType}`);
  }

  return result.data as PromptVersion;
}

async function getActiveHouseholds(client: ReturnType<typeof createServiceClient>) {
  const membersResult = await client
    .from("household_members")
    .select("household_id")
    .eq("is_active", true);

  if (membersResult.error) {
    throw new Error(`Failed to load active household memberships: ${membersResult.error.message}`);
  }

  const householdIds = [...new Set((membersResult.data ?? []).map((row) => row.household_id))];
  if (householdIds.length === 0) return [];

  const householdsResult = await client
    .from("households")
    .select("id, locale, timezone")
    .in("id", householdIds);

  if (householdsResult.error) {
    throw new Error(`Failed to load households: ${householdsResult.error.message}`);
  }

  return (householdsResult.data ?? []) as Array<{ id: string; locale: string | null; timezone: string | null }>;
}

async function processHousehold(
  client: ReturnType<typeof createServiceClient>,
  household: { id: string; locale: string | null; timezone: string | null },
  request: DispatchRequest,
): Promise<DispatchResult> {
  const timezone = household.timezone || "Asia/Ho_Chi_Minh";
  const language: "vi" | "en" = household.locale?.toLowerCase().startsWith("en") ? "en" : "vi";
  const period = getPeriodForFunction(request.functionType, timezone);

  const claim = await claimRun(client, {
    householdId: household.id,
    functionType: request.functionType,
    period,
    triggerSource: request.triggerSource ?? "manual",
    schedulerJobId: request.schedulerJobId,
  });

  if (!claim.shouldRun) {
    return {
      householdId: household.id,
      functionType: request.functionType,
      status: "skipped",
      reason: "duplicate_or_recent_run",
      runId: claim.runId,
    };
  }

  try {
    const todayIso = getTodayIso(timezone);
    const { monthStart, nextMonthStart } = getMonthBoundsForDate(todayIso);
    const monthlyCount = await countMonthlyAiInsights(client, household.id, monthStart, nextMonthStart);

    if (isCapExceeded(request.functionType, monthlyCount)) {
      await storeFallbackRuleInsight(client, {
        householdId: household.id,
        functionType: request.functionType,
        reason: "monthly_ai_cap",
        periodLabel: period.label,
      });

      await finishRun(client, {
        runId: claim.runId,
        status: "skipped",
        meta: {
          reason: "monthly_ai_cap",
          current_month_count: monthlyCount,
          function_priority: PRIORITY[request.functionType],
        },
      });

      return {
        householdId: household.id,
        functionType: request.functionType,
        status: "skipped",
        reason: "monthly_ai_cap",
        runId: claim.runId,
      };
    }

    let triggered = true;
    let context: Record<string, unknown> = {};

    if (request.functionType === "monthly_review") {
      context = await buildMonthlyReviewContext(client, household.id, period.end);
    } else if (request.functionType === "goal_risk_coach") {
      const goalContext = await buildGoalRiskContext(client, household.id, period.end);
      triggered = goalContext.triggered;
      context = goalContext.context;
    } else {
      const spendingContext = await buildSpendingAnomalyContext(client, household.id, period.end);
      triggered = spendingContext.triggered;
      context = spendingContext.context;
    }

    if (!triggered) {
      await finishRun(client, {
        runId: claim.runId,
        status: "skipped",
        meta: {
          reason: "trigger_not_met",
          function_priority: PRIORITY[request.functionType],
        },
      });

      return {
        householdId: household.id,
        functionType: request.functionType,
        status: "skipped",
        reason: "trigger_not_met",
        runId: claim.runId,
      };
    }

    const promptVersion = await loadActivePromptVersion(client, request.functionType);
    const prompt = buildPrompt(request.functionType, promptVersion, context);

    const startMs = Date.now();
    const model = await callGemini(prompt);
    const latencyMs = Date.now() - startMs;

    const modelJson = parseModelJson<Record<string, unknown>>(model.text);
    const normalized = toFlatText(request.functionType, modelJson);

    const stored = await storeInsightAndDeliveries(client, {
      householdId: household.id,
      functionType: request.functionType,
      period,
      promptVersionId: promptVersion.id,
      runId: claim.runId,
      language,
      contentText: normalized.contentText,
      contentJson: {
        ...modelJson,
        title: normalized.title,
      },
      recommendationText: normalized.recommendation,
      confidenceLabel: normalized.confidence,
      modelProvider: "google",
      modelName: getEnv().geminiModel,
      tokenInput: model.usage.inputTokens ?? null,
      tokenOutput: model.usage.outputTokens ?? null,
      latencyMs,
    });

    await finishRun(client, {
      runId: claim.runId,
      status: "completed",
      meta: {
        prompt_version_id: promptVersion.id,
        prompt_version: promptVersion.version,
        delivery_count: stored.deliveryCount,
        tokens_input: model.usage.inputTokens ?? null,
        tokens_output: model.usage.outputTokens ?? null,
        tokens_total: model.usage.totalTokens ?? null,
        function_priority: PRIORITY[request.functionType],
      },
    });

    return {
      householdId: household.id,
      functionType: request.functionType,
      status: "completed",
      runId: claim.runId,
      insightId: stored.insightId,
    };
  } catch (error) {
    const message = asErrorMessage(error);

    await finishRun(client, {
      runId: claim.runId,
      status: "failed",
      errorMessage: message,
      meta: {
        function_priority: PRIORITY[request.functionType],
      },
    });

    return {
      householdId: household.id,
      functionType: request.functionType,
      status: "failed",
      runId: claim.runId,
      reason: message,
    };
  }
}

serve(async (request: Request) => {
  try {
    if (request.method !== "POST") {
      return jsonResponse(405, { error: "Method not allowed" });
    }

    const env = getEnv();
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization") || "";
    if (authHeader !== `Bearer ${env.aiWorkerSecret}`) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    const payload = (await request.json().catch(() => null)) as Partial<DispatchRequest> | null;
    if (!payload) return jsonResponse(400, { error: "Invalid JSON body" });

    const functionType = normalizeFunctionType(payload.functionType);
    if (!functionType) {
      return jsonResponse(400, {
        error: `Invalid functionType. Allowed: ${AI_FUNCTION_TYPES.join(", ")}`,
      });
    }

    const triggerSource = payload.triggerSource ?? "manual";
    const client = createServiceClient();

    const households = await getActiveHouseholds(client);
    const results: DispatchResult[] = [];

    for (const household of households) {
      const result = await processHousehold(client, household, {
        functionType,
        triggerSource,
        schedulerJobId: payload.schedulerJobId,
      });
      results.push(result);
    }

    const summary = {
      total_households: households.length,
      completed: results.filter((result) => result.status === "completed").length,
      skipped: results.filter((result) => result.status === "skipped").length,
      failed: results.filter((result) => result.status === "failed").length,
    };

    return jsonResponse(200, {
      ok: true,
      functionType,
      summary,
      results,
    });
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      error: asErrorMessage(error),
    });
  }
});
