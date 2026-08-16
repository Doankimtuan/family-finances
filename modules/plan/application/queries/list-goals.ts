import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import {
  listAccounts,
  listDebts,
  listLoans,
} from "@/modules/ledger/application";
import { listSavings } from "@/modules/savings/application";
import { listInvestmentPortfolio } from "@/modules/investments/application";
import {
  deriveGoalFundingSummary,
  type GoalFundingSourceValue,
} from "../goal-funding";
import {
  GoalFundingSourceKind,
  GoalStatus,
  type GoalFundingSourceKind as GoalFundingSourceKindValue,
} from "../plan-constants";
import {
  mapGoalRow,
  type GoalDetail,
  type GoalFundingLink,
  type GoalsList,
} from "../goal-recurring-types";

type GoalRow = {
  id: string;
  name: string;
  target_amount: number | string;
  funded_amount: number | string;
  legacy_funded_amount: number | string | null;
  target_date: string | null;
  status: string;
  goal_type: string | null;
  initial_principal_snapshot: number | string | null;
};
type FundingLinkRow = {
  id: string;
  goal_id: string;
  source_kind: string;
  saving_id: string | null;
  account_id: string | null;
  holding_id: string | null;
  loan_id: string | null;
  debt_id: string | null;
  initial_principal_snapshot: number | string | null;
};
function sourceId(row: FundingLinkRow): string | null {
  switch (row.source_kind) {
    case GoalFundingSourceKind.SAVING:
      return row.saving_id;
    case GoalFundingSourceKind.SAVINGS_ACCOUNT:
      return row.account_id;
    case GoalFundingSourceKind.HOLDING:
      return row.holding_id;
    case GoalFundingSourceKind.LOAN:
      return row.loan_id;
    case GoalFundingSourceKind.DEBT:
      return row.debt_id;
    default:
      return null;
  }
}
function asNumber(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : null;
}
function valuationStatus(
  date: string | null | undefined,
): "current" | "stale" | "missing" {
  if (!date) return "missing";
  const ageDays = (Date.now() - Date.parse(date)) / 86_400_000;
  return Number.isFinite(ageDays) && ageDays > 7 ? "stale" : "current";
}
async function mapFundingLinks(
  rows: FundingLinkRow[],
): Promise<
  Map<string, { links: GoalFundingLink[]; sources: GoalFundingSourceValue[] }>
> {
  if (rows.length === 0) return new Map();
  const [savings, accounts, portfolio, loans, debts] = await Promise.all([
    listSavings(),
    listAccounts(),
    listInvestmentPortfolio(),
    listLoans(),
    listDebts(),
  ]);
  const savingMap = new Map((savings ?? []).map((item) => [item.id, item]));
  const accountMap = new Map(
    (accounts?.accounts ?? []).map((item) => [item.id, item]),
  );
  const holdingMap = new Map(
    (portfolio?.holdings ?? []).map((item) => [item.id, item]),
  );
  const loanMap = new Map((loans ?? []).map((item) => [item.id, item]));
  const debtMap = new Map((debts ?? []).map((item) => [item.id, item]));
  const byGoal = new Map<
    string,
    { links: GoalFundingLink[]; sources: GoalFundingSourceValue[] }
  >();
  for (const row of rows) {
    const id = sourceId(row);
    if (!id) continue;
    const kind = row.source_kind as GoalFundingSourceKindValue;
    let sourceName = id;
    let currentAmount = 0;
    let availability: GoalFundingLink["availability"] = "available";
    let valueStatus: GoalFundingSourceValue["valueStatus"] = "current";
    const source: GoalFundingSourceValue = { kind, sourceId: id };
    switch (kind) {
      case GoalFundingSourceKind.SAVING: {
        const item = savingMap.get(id);
        sourceName = item?.productName ?? id;
        currentAmount = item?.latestCycle?.principal ?? 0;
        source.currentValue = item?.latestCycle?.principal ?? null;
        if (!item) {
          availability = "missing";
          valueStatus = "missing";
        }
        break;
      }
      case GoalFundingSourceKind.SAVINGS_ACCOUNT: {
        const item = accountMap.get(id);
        sourceName = item?.name ?? id;
        currentAmount = item?.balance ?? 0;
        source.currentValue = item?.balance ?? null;
        if (!item) {
          availability = "missing";
          valueStatus = "missing";
        }
        break;
      }
      case GoalFundingSourceKind.HOLDING: {
        const item = holdingMap.get(id);
        sourceName = item?.name ?? id;
        currentAmount = item?.currentValue ?? 0;
        source.currentValue = item?.currentValue;
        source.costBasis = item?.remainingTotalCostBasis;
        source.updatedAt = item?.currentValuationDate;
        valueStatus = valuationStatus(item?.currentValuationDate);
        if (!item) {
          availability = "missing";
          valueStatus = "missing";
        }
        break;
      }
      case GoalFundingSourceKind.LOAN: {
        const item = loanMap.get(id);
        sourceName = item?.name ?? id;
        currentAmount = item?.remainingPrincipal ?? 0;
        source.originalPrincipal = item?.principal;
        source.remainingPrincipal = item?.remainingPrincipal;
        source.initialPrincipalSnapshot =
          asNumber(row.initial_principal_snapshot) ?? item?.principal;
        if (!item) {
          availability = "missing";
          valueStatus = "missing";
        }
        break;
      }
      case GoalFundingSourceKind.DEBT: {
        const item = debtMap.get(id);
        sourceName = item?.name ?? id;
        currentAmount = item?.remainingAmount ?? 0;
        source.originalPrincipal = item?.principalAmount;
        source.remainingPrincipal = item?.remainingAmount;
        source.initialPrincipalSnapshot =
          asNumber(row.initial_principal_snapshot) ?? item?.principalAmount;
        if (!item) {
          availability = "missing";
          valueStatus = "missing";
        }
        break;
      }
    }
    source.currentAmount = currentAmount;
    source.valueStatus = valueStatus;
    const current = byGoal.get(row.goal_id) ?? { links: [], sources: [] };
    current.links.push({
      id: row.id,
      kind,
      sourceId: id,
      sourceName,
      currentAmount,
      valueStatus,
      availability,
    });
    current.sources.push(source);
    byGoal.set(row.goal_id, current);
  }
  return byGoal;
}
async function loadGoalRows(householdId: string, goalId?: string) {
  const supabase = await createSupabaseServerClient();
  let goalsQuery = supabase
    .from("goals")
    .select(
      "id, name, target_amount, funded_amount, legacy_funded_amount, target_date, status, goal_type, initial_principal_snapshot",
    )
    .eq("household_id", householdId);
  if (goalId) goalsQuery = goalsQuery.eq("id", goalId);
  else
    goalsQuery = goalsQuery
      .neq("status", GoalStatus.CANCELLED)
      .order("created_at", { ascending: false });
  const [{ data: rows, error }, { data: linkRows, error: linkError }] =
    await Promise.all([
      goalsQuery,
      supabase
        .from("goal_funding_links")
        .select(
          "id, goal_id, source_kind, saving_id, account_id, holding_id, loan_id, debt_id, initial_principal_snapshot",
        )
        .eq("household_id", householdId)
        .eq("is_active", true),
    ]);
  if (error || linkError) return null;
  const linksByGoal = await mapFundingLinks(
    (linkRows ?? []) as FundingLinkRow[],
  );
  return ((rows ?? []) as GoalRow[]).map((row) => {
    const funding = linksByGoal.get(row.id);
    const summary = funding
      ? deriveGoalFundingSummary(funding.sources)
      : undefined;
    return mapGoalRow(row, {
      fundingLinks: funding?.links ?? [],
      fundingSummary: summary,
      fundingValueStatus: summary?.valueStatus,
    });
  });
}
export async function listGoals(): Promise<GoalsList | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: household }, goals] = await Promise.all([
      supabase
        .from("households")
        .select("base_currency")
        .eq("id", gate.householdId)
        .maybeSingle(),
      loadGoalRows(gate.householdId),
    ]);
    if (!goals) return null;
    return {
      householdId: gate.householdId,
      currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
      goals,
    };
  } catch {
    return null;
  }
}

export async function getGoal(goalId: string): Promise<GoalDetail | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: household }, goals] = await Promise.all([
      supabase
        .from("households")
        .select("base_currency")
        .eq("id", gate.householdId)
        .maybeSingle(),
      loadGoalRows(gate.householdId, goalId),
    ]);
    const goal = goals?.[0];
    if (!goal) return null;
    return {
      ...goal,
      householdId: gate.householdId,
      currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
    };
  } catch {
    return null;
  }
}
