import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { AccountType } from "@/modules/ledger/application/ledger-constants";
import { isGoalFundingSourceCompatible } from "../goal-funding";
import {
  GoalFundingSourceKind,
  GOAL_FUNDING_LINKABLE_STATUS_VALUES,
  GOAL_FUNDING_SOURCE_KIND_VALUES,
  type GoalFundingSourceKind as GoalFundingSourceKindValue,
} from "../plan-constants";
export const linkGoalFundingInputSchema = z.object({
  goalId: z.string().uuid(),
  sourceKind: z.enum(GOAL_FUNDING_SOURCE_KIND_VALUES),
  sourceId: z.string().uuid(),
});
export const unlinkGoalFundingInputSchema = z.object({
  goalId: z.string().uuid(),
  linkId: z.string().uuid(),
});
export type LinkGoalFundingInput = z.infer<typeof linkGoalFundingInputSchema>;
export type UnlinkGoalFundingInput = z.infer<
  typeof unlinkGoalFundingInputSchema
>;
export type GoalFundingMutationResult =
  { ok: true } | { ok: false; code: ProductActionErrorCode };
type SourceConfig = {
  table: string;
  linkColumn: "saving_id" | "account_id" | "holding_id" | "loan_id" | "debt_id";
};
function sourceConfig(kind: GoalFundingSourceKindValue): SourceConfig {
  switch (kind) {
    case GoalFundingSourceKind.SAVING:
      return { table: "savings", linkColumn: "saving_id" };
    case GoalFundingSourceKind.SAVINGS_ACCOUNT:
      return { table: "accounts", linkColumn: "account_id" };
    case GoalFundingSourceKind.HOLDING:
      return { table: "investment_holdings", linkColumn: "holding_id" };
    case GoalFundingSourceKind.LOAN:
      return { table: "loans", linkColumn: "loan_id" };
    case GoalFundingSourceKind.DEBT:
      return { table: "liabilities", linkColumn: "debt_id" };
  }
}
function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}
function asNumber(value: unknown): number {
  const result = typeof value === "string" ? Number(value) : value;
  return typeof result === "number" && Number.isFinite(result) ? result : 0;
}
function sourceCurrency(
  kind: GoalFundingSourceKindValue,
  row: unknown,
): string | null {
  const record = asRecord(row);
  if (kind === GoalFundingSourceKind.SAVING) {
    const snapshot = asRecord(record.product_snapshot);
    const currency = snapshot.currency;
    return typeof currency === "string" ? currency.toUpperCase() : null;
  }
  const currency = record.currency;
  return typeof currency === "string" ? currency.toUpperCase() : null;
}
async function validateSource(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  householdId: string,
  goalType: string,
  goalCurrency: string,
  kind: GoalFundingSourceKindValue,
  sourceId: string,
): Promise<boolean> {
  if (!isGoalFundingSourceCompatible(goalType as never, kind)) return false;
  const config = sourceConfig(kind);
  const { data, error } = await supabase
    .from(config.table)
    .select("*")
    .eq("id", sourceId)
    .eq("household_id", householdId)
    .maybeSingle();
  if (error || !data) return false;
  const row = asRecord(data);
  const currency = sourceCurrency(kind, data);
  if (currency && currency !== goalCurrency.toUpperCase()) return false;
  switch (kind) {
    case GoalFundingSourceKind.SAVING:
      return row.status === "active" || row.status === "matured";
    case GoalFundingSourceKind.SAVINGS_ACCOUNT:
      return row.type === AccountType.SAVINGS && row.is_archived !== true;
    case GoalFundingSourceKind.HOLDING:
      return row.lifecycle_status !== "exited" && asNumber(row.quantity) > 0;
    case GoalFundingSourceKind.LOAN:
      return (
        row.status !== "completed" && asNumber(row.remaining_principal) > 0
      );
    case GoalFundingSourceKind.DEBT:
      return (
        row.is_archived !== true &&
        row.status !== "completed" &&
        asNumber(row.remaining_amount) > 0
      );
  }
}
export async function linkGoalFunding(
  raw: LinkGoalFundingInput,
): Promise<GoalFundingMutationResult> {
  const parsed = linkGoalFundingInputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const config = sourceConfig(parsed.data.sourceKind);
    const [{ data: goal }, { data: household }] = await Promise.all([
      supabase
        .from("goals")
        .select("id, status, goal_type")
        .eq("id", parsed.data.goalId)
        .eq("household_id", gate.householdId)
        .in("status", [...GOAL_FUNDING_LINKABLE_STATUS_VALUES])
        .maybeSingle(),
      supabase
        .from("households")
        .select("base_currency")
        .eq("id", gate.householdId)
        .maybeSingle(),
    ]);
    if (!goal) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    const sourceValid = await validateSource(
      supabase,
      gate.householdId,
      goal.goal_type,
      household?.base_currency ?? "VND",
      parsed.data.sourceKind,
      parsed.data.sourceId,
    );
    if (!sourceValid)
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    const { data: conflict } = await supabase
      .from("goal_funding_links")
      .select("id")
      .eq("household_id", gate.householdId)
      .eq(config.linkColumn, parsed.data.sourceId)
      .eq("is_active", true)
      .neq("goal_id", parsed.data.goalId)
      .limit(1)
      .maybeSingle();
    if (conflict) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    const { data: existing } = await supabase
      .from("goal_funding_links")
      .select("id, initial_principal_snapshot")
      .eq("household_id", gate.householdId)
      .eq("goal_id", parsed.data.goalId)
      .eq(config.linkColumn, parsed.data.sourceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const now = new Date().toISOString();
    let initialPrincipalSnapshot: number | null = null;
    if (
      parsed.data.sourceKind === GoalFundingSourceKind.LOAN ||
      parsed.data.sourceKind === GoalFundingSourceKind.DEBT
    ) {
      const principalColumn =
        parsed.data.sourceKind === GoalFundingSourceKind.LOAN
          ? "principal"
          : "principal_amount";
      const { data: principalRow, error: principalError } = await supabase
        .from(config.table)
        .select(principalColumn)
        .eq("id", parsed.data.sourceId)
        .eq("household_id", gate.householdId)
        .maybeSingle();
      const principalValue = principalRow
        ? asNumber(asRecord(principalRow)[principalColumn])
        : 0;
      if (principalError || principalValue <= 0)
        return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
      initialPrincipalSnapshot = Math.trunc(principalValue);
    }
    const mutation = existing
      ? supabase
          .from("goal_funding_links")
          .update({
            is_active: true,
            ...(existing.initial_principal_snapshot == null &&
            initialPrincipalSnapshot != null
              ? { initial_principal_snapshot: initialPrincipalSnapshot }
              : {}),
            linked_at: now,
            linked_by: gate.userId,
            unlinked_at: null,
            unlinked_by: null,
          })
          .eq("id", existing.id)
          .eq("household_id", gate.householdId)
      : supabase.from("goal_funding_links").insert({
          household_id: gate.householdId,
          goal_id: parsed.data.goalId,
          source_kind: parsed.data.sourceKind,
          [config.linkColumn]: parsed.data.sourceId,
          is_active: true,
          linked_at: now,
          linked_by: gate.userId,
          created_by: gate.userId,
          ...(initialPrincipalSnapshot != null
            ? { initial_principal_snapshot: initialPrincipalSnapshot }
            : {}),
        });
    const { error } = await mutation;
    return error
      ? { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID }
      : { ok: true };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
export async function unlinkGoalFunding(
  raw: UnlinkGoalFundingInput,
): Promise<GoalFundingMutationResult> {
  const parsed = unlinkGoalFundingInputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("goal_funding_links")
      .update({
        is_active: false,
        unlinked_at: new Date().toISOString(),
        unlinked_by: gate.userId,
      })
      .eq("id", parsed.data.linkId)
      .eq("goal_id", parsed.data.goalId)
      .eq("household_id", gate.householdId)
      .eq("is_active", true)
      .select("id")
      .maybeSingle();
    return error || !data
      ? { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN }
      : { ok: true };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
