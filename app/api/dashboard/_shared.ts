import { createClient } from "@/lib/supabase/server";

export type RpcError = { message: string };

export type HealthSnapshotRow = {
  snapshot_month: string;
  overall_score: number;
  cashflow_score: number;
  emergency_score: number;
  debt_score: number;
  networth_score: number;
  goals_score: number;
  diversification_score: number;
  top_action: string;
  metrics_json: Record<string, number | null | Record<string, number>>;
};

export async function getHouseholdId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const householdResult = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (householdResult.error) {
    throw new Error(`Failed to resolve household: ${householdResult.error.message}`);
  }

  if (!householdResult.data?.household_id) {
    throw new Error("No household found. Create or join a household first.");
  }

  return householdResult.data.household_id;
}

export function monthRange(asOfDate: string) {
  const date = new Date(asOfDate);
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1),
  );
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1),
  );
  return {
    startISO: start.toISOString().slice(0, 10),
    endISO: end.toISOString().slice(0, 10),
  };
}

export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0)
    return error.message;
  return fallback;
}
