import type { SupabaseClient } from "@supabase/supabase-js";

import {
  computeSavingsCurrentValue,
  computeSavingsProjection,
} from "@/lib/savings/calculations";
import type {
  SavingsAccountRow,
  SavingsListItem,
  SavingsMaturityActionRow,
  SavingsRateHistoryRow,
  SavingsSummary,
  SavingsWithdrawalRow,
} from "@/lib/savings/types";

function asNumber(value: unknown) {
  return Number(value ?? 0);
}

function normalizeAccount(row: Record<string, unknown>): SavingsAccountRow {
  return {
    ...(row as unknown as SavingsAccountRow),
    principal_amount: asNumber(row.principal_amount),
    current_principal_remaining: asNumber(row.current_principal_remaining),
    annual_rate: Number(row.annual_rate ?? 0),
    early_withdrawal_rate:
      row.early_withdrawal_rate === null || row.early_withdrawal_rate === undefined
        ? null
        : Number(row.early_withdrawal_rate),
    tax_rate: Number(row.tax_rate ?? 0),
    linked_account_ids: Array.isArray(row.linked_account_ids)
      ? (row.linked_account_ids as string[])
      : [],
    next_plan_config:
      row.next_plan_config && typeof row.next_plan_config === "object"
        ? (row.next_plan_config as Record<string, unknown>)
        : {},
  };
}

function normalizeWithdrawal(row: Record<string, unknown>): SavingsWithdrawalRow {
  return {
    ...(row as unknown as SavingsWithdrawalRow),
    requested_principal_amount: asNumber(row.requested_principal_amount),
    gross_interest_amount: asNumber(row.gross_interest_amount),
    tax_amount: asNumber(row.tax_amount),
    penalty_amount: asNumber(row.penalty_amount),
    net_received_amount: asNumber(row.net_received_amount),
    remaining_principal_after: asNumber(row.remaining_principal_after),
  };
}

function normalizeRate(row: Record<string, unknown>): SavingsRateHistoryRow {
  return {
    ...(row as unknown as SavingsRateHistoryRow),
    annual_rate: Number(row.annual_rate ?? 0),
    early_withdrawal_rate:
      row.early_withdrawal_rate === null || row.early_withdrawal_rate === undefined
        ? null
        : Number(row.early_withdrawal_rate),
    tax_rate: Number(row.tax_rate ?? 0),
    term_days: asNumber(row.term_days),
  };
}

function normalizeAction(row: Record<string, unknown>): SavingsMaturityActionRow {
  return {
    ...(row as unknown as SavingsMaturityActionRow),
    gross_principal_amount: asNumber(row.gross_principal_amount),
    gross_interest_amount: asNumber(row.gross_interest_amount),
    tax_amount: asNumber(row.tax_amount),
    net_rollover_amount: asNumber(row.net_rollover_amount),
    applied_annual_rate:
      row.applied_annual_rate === null || row.applied_annual_rate === undefined
        ? null
        : Number(row.applied_annual_rate),
    applied_term_days:
      row.applied_term_days === null || row.applied_term_days === undefined
        ? null
        : Number(row.applied_term_days),
  };
}

export async function fetchSavingsBundle(
  supabase: SupabaseClient,
  householdId: string,
  filters?: {
    id?: string;
    status?: string;
    savingsType?: string;
    goalId?: string;
  },
) {
  let accountsQuery = supabase
    .from("savings_accounts")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  if (filters?.id) accountsQuery = accountsQuery.eq("id", filters.id);
  if (filters?.status) accountsQuery = accountsQuery.eq("status", filters.status);
  if (filters?.savingsType) {
    accountsQuery = accountsQuery.eq("savings_type", filters.savingsType);
  }
  if (filters?.goalId) accountsQuery = accountsQuery.eq("goal_id", filters.goalId);

  const accountsResult = await accountsQuery;
  if (accountsResult.error) throw new Error(accountsResult.error.message);

  const accounts = (accountsResult.data ?? []).map((row) =>
    normalizeAccount(row as Record<string, unknown>),
  );
  const savingsIds = accounts.map((row) => row.id);
  const rateOrigins = accounts
    .map((row) => row.origin_rate_history_id)
    .filter((value): value is string => Boolean(value));

  const [withdrawalsResult, actionsResult, goalsResult, ratesResult] =
    await Promise.all([
      savingsIds.length
        ? supabase
            .from("savings_withdrawals")
            .select("*")
            .eq("household_id", householdId)
            .in("savings_account_id", savingsIds)
            .order("withdrawal_date", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      savingsIds.length
        ? supabase
            .from("savings_maturity_actions")
            .select("*")
            .eq("household_id", householdId)
            .in("savings_account_id", savingsIds)
            .order("action_date", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("goals")
        .select("id, name")
        .eq("household_id", householdId),
      rateOrigins.length
        ? supabase
            .from("savings_rate_history")
            .select("*")
            .eq("household_id", householdId)
            .in("id", rateOrigins)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (withdrawalsResult.error) throw new Error(withdrawalsResult.error.message);
  if (actionsResult.error) throw new Error(actionsResult.error.message);
  if (goalsResult.error) throw new Error(goalsResult.error.message);
  if (ratesResult.error) throw new Error(ratesResult.error.message);

  const withdrawals = (withdrawalsResult.data ?? []).map((row) =>
    normalizeWithdrawal(row as Record<string, unknown>),
  );
  const actions = (actionsResult.data ?? []).map((row) =>
    normalizeAction(row as Record<string, unknown>),
  );
  const goals = new Map((goalsResult.data ?? []).map((row) => [row.id, row.name]));
  const rates = new Map(
    (ratesResult.data ?? []).map((row) => {
      const normalized = normalizeRate(row as Record<string, unknown>);
      return [normalized.id, normalized];
    }),
  );

  return { accounts, withdrawals, actions, goals, rates };
}

export function buildSavingsListItems(
  accounts: SavingsAccountRow[],
  withdrawals: SavingsWithdrawalRow[],
  goalMap: Map<string, string>,
  asOfDate: string,
): SavingsListItem[] {
  return accounts.map((account) => {
    const accountWithdrawals = withdrawals.filter(
      (row) => row.savings_account_id === account.id,
    );
    const currentValue = computeSavingsCurrentValue(
      account,
      accountWithdrawals,
      asOfDate,
    );
    const daysUntilMaturity = account.maturity_date
      ? Math.max(
          0,
          Math.floor(
            (new Date(`${account.maturity_date}T00:00:00.000Z`).getTime() -
              new Date(`${asOfDate}T00:00:00.000Z`).getTime()) /
              86_400_000,
          ),
        )
      : null;
    const totalTermDays =
      account.term_mode === "fixed" && account.maturity_date
        ? Math.max(
            0,
            Math.floor(
              (new Date(`${account.maturity_date}T00:00:00.000Z`).getTime() -
                new Date(`${account.start_date}T00:00:00.000Z`).getTime()) /
                86_400_000,
            ),
          )
        : null;
    const elapsedTermDays =
      totalTermDays === null
        ? null
        : Math.min(currentValue.daysElapsed, totalTermDays);

    let uiStatus: SavingsListItem["uiStatus"] = "ACTIVE";
    if (account.status === "withdrawn") uiStatus = "WITHDRAWN";
    else if (account.status === "matured") uiStatus = "MATURED";
    else if (
      account.status === "maturing_soon" ||
      (daysUntilMaturity !== null && daysUntilMaturity <= 7)
    ) {
      uiStatus = "MATURING_SOON";
    }

    return {
      id: account.id,
      providerName: account.provider_name,
      productName: account.product_name,
      savingsType: account.savings_type,
      interestType: account.interest_type,
      termMode: account.term_mode,
      principalAmount: account.principal_amount,
      currentPrincipalRemaining: account.current_principal_remaining,
      annualRate: account.annual_rate,
      taxRate: account.tax_rate,
      startDate: account.start_date,
      maturityDate: account.maturity_date,
      status: account.status,
      uiStatus,
      goalId: account.goal_id,
      goalName: account.goal_id ? (goalMap.get(account.goal_id) ?? null) : null,
      currentValue,
      daysUntilMaturity,
      totalTermDays,
      elapsedTermDays,
    };
  });
}

export function buildSavingsSummary(items: SavingsListItem[]): SavingsSummary {
  const activeItems = items.filter(
    (item) => !["withdrawn", "cancelled"].includes(item.status),
  );
  const sortedMaturity = activeItems
    .filter((item) => item.maturityDate)
    .sort((a, b) => (a.maturityDate ?? "").localeCompare(b.maturityDate ?? ""));
  const nextMaturity = sortedMaturity[0] ?? null;

  return {
    totalGrossValue: activeItems.reduce(
      (sum, item) => sum + item.currentValue.grossValue,
      0,
    ),
    totalLiquidationValue: activeItems.reduce(
      (sum, item) => sum + item.currentValue.liquidationValue,
      0,
    ),
    totalAccruedInterest: activeItems.reduce(
      (sum, item) => sum + item.currentValue.accruedInterest,
      0,
    ),
    upcomingCount30d: activeItems.filter(
      (item) =>
        item.daysUntilMaturity !== null && item.daysUntilMaturity <= 30,
    ).length,
    nextMaturity: nextMaturity
      ? {
          id: nextMaturity.id,
          providerName: nextMaturity.providerName,
          maturityDate: nextMaturity.maturityDate!,
          grossValue: nextMaturity.currentValue.grossValue,
        }
      : null,
    goalLinkedValue: activeItems
      .filter((item) => item.goalId)
      .reduce((sum, item) => sum + item.currentValue.grossValue, 0),
    byType: {
      bank: activeItems
        .filter((item) => item.savingsType === "bank")
        .reduce((sum, item) => sum + item.currentValue.grossValue, 0),
      third_party: activeItems
        .filter((item) => item.savingsType === "third_party")
        .reduce((sum, item) => sum + item.currentValue.grossValue, 0),
    },
  };
}

export function buildFeaturedSavingsItems(
  items: SavingsListItem[],
  limit = 3,
) {
  const priority = (status: SavingsListItem["uiStatus"]) => {
    if (status === "MATURING_SOON") return 0;
    if (status === "MATURED") return 1;
    if (status === "ACTIVE") return 2;
    return 3;
  };

  return [...items]
    .filter((item) => item.status !== "withdrawn" && item.status !== "cancelled")
    .sort((a, b) => {
      const byPriority = priority(a.uiStatus) - priority(b.uiStatus);
      if (byPriority !== 0) return byPriority;

      const aDays = a.daysUntilMaturity ?? Number.POSITIVE_INFINITY;
      const bDays = b.daysUntilMaturity ?? Number.POSITIVE_INFINITY;
      if (aDays !== bDays) return aDays - bDays;

      return b.currentValue.grossValue - a.currentValue.grossValue;
    })
    .slice(0, limit);
}

export function buildSavingsDetailPayload(
  account: SavingsAccountRow,
  withdrawals: SavingsWithdrawalRow[],
  rates: SavingsRateHistoryRow[],
  actions: SavingsMaturityActionRow[],
  asOfDate: string,
  projectionDays?: number,
) {
  const computed = computeSavingsCurrentValue(account, withdrawals, asOfDate);
  const projection = computeSavingsProjection(
    account,
    withdrawals,
    asOfDate,
    projectionDays,
  );

  return {
    account,
    computed,
    withdrawals,
    rates,
    actions,
    projection,
  };
}
