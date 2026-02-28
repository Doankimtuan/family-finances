import type { InsightFunctionType, InsightPeriod, TriggerSource } from "./types.ts";

type RpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export async function claimRun(
  client: RpcClient,
  input: {
    householdId: string;
    functionType: InsightFunctionType;
    period: InsightPeriod;
    triggerSource: TriggerSource;
    schedulerJobId?: string;
  },
): Promise<{ runId: number; shouldRun: boolean; attemptCount: number }> {
  const { data, error } = await client.rpc("claim_ai_insight_run", {
    p_household_id: input.householdId,
    p_function_type: input.functionType,
    p_period_start: input.period.start,
    p_period_end: input.period.end,
    p_trigger_source: input.triggerSource,
    p_scheduler_job_id: input.schedulerJobId ?? null,
  });

  if (error) {
    throw new Error(`Failed to claim run: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row) {
    throw new Error("Run claim returned empty response");
  }

  return {
    runId: Number((row as { run_id: unknown }).run_id),
    shouldRun: Boolean((row as { should_run: unknown }).should_run),
    attemptCount: Number((row as { attempt_count: unknown }).attempt_count ?? 1),
  };
}

export async function finishRun(
  client: RpcClient,
  input: {
    runId: number;
    status: "completed" | "failed" | "skipped";
    errorMessage?: string;
    meta?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await client.rpc("finish_ai_insight_run", {
    p_run_id: input.runId,
    p_status: input.status,
    p_error_message: input.errorMessage ?? null,
    p_meta_json: input.meta ?? {},
  });

  if (error) {
    throw new Error(`Failed to finish run: ${error.message}`);
  }
}
