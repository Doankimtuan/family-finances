import type { InsightFunctionType, StoredInsightInput } from "./types.ts";

type DBClient = {
  from: (table: string) => {
    insert: (values: Record<string, unknown> | Array<Record<string, unknown>>) => {
      select: (columns: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
    select: (columns: string, options?: { count?: "exact"; head?: boolean }) => {
      eq: (column: string, value: unknown) => {
        eq: (column: string, value: unknown) => {
          gte: (column: string, value: unknown) => {
            lt: (column: string, value: unknown) => Promise<{ count: number | null; error: { message: string } | null }>;
          };
        };
      };
    };
  };
};

export async function countMonthlyAiInsights(
  client: DBClient,
  householdId: string,
  monthStartIso: string,
  nextMonthStartIso: string,
): Promise<number> {
  const { count, error } = await client
    .from("ai_insights")
    .select("id", { count: "exact", head: true })
    .eq("household_id", householdId)
    .gte("generated_at", `${monthStartIso}T00:00:00.000Z`)
    .lt("generated_at", `${nextMonthStartIso}T00:00:00.000Z`);

  if (error) throw new Error(`Failed to count monthly AI insights: ${error.message}`);
  return count ?? 0;
}

export async function storeInsightAndDeliveries(
  client: DBClient,
  input: StoredInsightInput,
): Promise<{ insightId: string; deliveryCount: number }> {
  const insightInsert = await client
    .from("ai_insights")
    .insert({
      household_id: input.householdId,
      function_type: input.functionType,
      period_start: input.period.start,
      period_end: input.period.end,
      prompt_version_id: input.promptVersionId,
      run_id: input.runId,
      language: input.language,
      model_provider: input.modelProvider,
      model_name: input.modelName,
      content_text: input.contentText,
      content_json: input.contentJson,
      recommendation_text: input.recommendationText,
      confidence_label: input.confidenceLabel,
      token_input: input.tokenInput,
      token_output: input.tokenOutput,
      latency_ms: input.latencyMs,
    })
    .select("id")
    .single();

  if (insightInsert.error || !insightInsert.data?.id) {
    throw new Error(insightInsert.error?.message ?? "Failed to store AI insight");
  }

  const insightId = String(insightInsert.data.id);

  const members = await (client as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: unknown) => {
          eq: (column: string, value: unknown) => Promise<{
            data: Array<{ user_id: string }> | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  })
    .from("household_members")
    .select("user_id")
    .eq("household_id", input.householdId)
    .eq("is_active", true);

  if (members.error) {
    throw new Error(`Failed to load household members for delivery: ${members.error.message}`);
  }

  const deliveries = (members.data ?? []).map((row) => ({
    insight_id: insightId,
    household_id: input.householdId,
    recipient_user_id: row.user_id,
    channel: "in_app",
    delivery_status: "sent",
    delivered_at: new Date().toISOString(),
  }));

  if (deliveries.length > 0) {
    const deliveryInsert = await (client as unknown as {
      from: (table: string) => {
        insert: (values: Array<Record<string, unknown>>) => Promise<{ error: { message: string } | null }>;
      };
    })
      .from("ai_insight_deliveries")
      .insert(deliveries);

    if (deliveryInsert.error) {
      throw new Error(`Failed to store delivery rows: ${deliveryInsert.error.message}`);
    }
  }

  return { insightId, deliveryCount: deliveries.length };
}

export async function storeFallbackRuleInsight(
  client: {
    from: (table: string) => {
      insert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
  },
  input: {
    householdId: string;
    functionType: InsightFunctionType;
    reason: string;
    periodLabel: string;
  },
): Promise<void> {
  const titleByType: Record<InsightFunctionType, string> = {
    monthly_review: "Tạm dùng cảnh báo quy tắc cho tổng kết tháng",
    goal_risk_coach: "Tạm dùng cảnh báo quy tắc cho rủi ro mục tiêu",
    spending_anomaly_explainer: "Tạm dùng cảnh báo quy tắc cho bất thường chi tiêu",
  };

  const bodyByType: Record<InsightFunctionType, string> = {
    monthly_review:
      "Đã đạt giới hạn AI trong tháng hiện tại để tối ưu chi phí. Hệ thống vẫn duy trì cảnh báo quy tắc để bạn không bỏ lỡ tín hiệu quan trọng.",
    goal_risk_coach:
      "Đã đạt giới hạn AI trong tháng hiện tại. Hệ thống tiếp tục theo dõi tiến độ mục tiêu bằng quy tắc và sẽ ưu tiên AI ở kỳ sau.",
    spending_anomaly_explainer:
      "Đã đạt giới hạn AI trong tháng hiện tại. Bất thường chi tiêu vẫn được phát hiện bằng quy tắc để bạn hành động kịp thời.",
  };

  const { error } = await client.from("insights").insert({
    household_id: input.householdId,
    insight_type: "custom",
    severity: "warning",
    title: titleByType[input.functionType],
    body: `${bodyByType[input.functionType]} (${input.periodLabel}; lý do: ${input.reason})`,
    action_label: "Mở Insights",
    action_target: "/insights",
    is_dismissed: false,
    generated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to store fallback rule insight: ${error.message}`);
  }
}
