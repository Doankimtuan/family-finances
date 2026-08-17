import {
  listAccounts,
  listDebts,
  listLoans,
} from "@/modules/ledger/application";
import { AccountType } from "@/modules/ledger/application/ledger-constants";
import { listSavings } from "@/modules/savings/application";
import { listInvestmentPortfolio } from "@/modules/investments/application";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  goalFundingSourceKey,
  isGoalFundingSourceCompatible,
} from "../goal-funding";
import {
  GoalFundingSourceKind,
  PLAN_OPERATION,
  type GoalFundingSourceKind as GoalFundingSourceKindValue,
  type GoalType as GoalTypeValue,
} from "../plan-constants";
import { logPlanFailure } from "../plan-error";

export type GoalFundingOption = {
  kind: GoalFundingSourceKindValue;
  sourceId: string;
  name: string;
  currentAmount: number;
  currency: string | null;
  sourceType: "savings" | "investments" | "debt";
  isAvailable: boolean;
  linkedGoalId: string | null;
  availability: "available" | "already_linked" | "unavailable";
};

type OptionBase = Omit<
  GoalFundingOption,
  "isAvailable" | "linkedGoalId" | "availability"
>;

export async function listGoalFundingOptions(input?: {
  goalType?: GoalTypeValue;
  goalId?: string;
}): Promise<GoalFundingOption[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const [
      householdResult,
      savings,
      accounts,
      portfolio,
      loans,
      debts,
      linksResult,
    ] = await Promise.all([
      supabase
        .from("households")
        .select("base_currency")
        .eq("id", gate.householdId)
        .maybeSingle(),
      listSavings(),
      listAccounts(),
      listInvestmentPortfolio(),
      listLoans(),
      listDebts(),
      supabase
        .from("goal_funding_links")
        .select(
          "goal_id, source_kind, saving_id, account_id, holding_id, loan_id, debt_id",
        )
        .eq("household_id", gate.householdId)
        .eq("is_active", true),
    ]);
    if (householdResult.error || linksResult.error) {
      logPlanFailure(
        householdResult.error ?? linksResult.error,
        PLAN_OPERATION.LIST_GOAL_FUNDING_OPTIONS,
        { householdId: gate.householdId },
      );
      return null;
    }
    const goalCurrency = (
      householdResult.data?.base_currency ?? "VND"
    ).toUpperCase();
    const ownerBySource = new Map<string, string>();
    for (const link of linksResult.data ?? []) {
      const sourceId =
        link.saving_id ??
        link.account_id ??
        link.holding_id ??
        link.loan_id ??
        link.debt_id;
      if (sourceId) {
        ownerBySource.set(
          goalFundingSourceKey({
            kind: link.source_kind as GoalFundingSourceKindValue,
            sourceId,
          }),
          link.goal_id,
        );
      }
    }
    const options: OptionBase[] = [
      ...(savings ?? [])
        .filter(
          (saving) => saving.status === "active" || saving.status === "matured",
        )
        .map((saving) => ({
          kind: GoalFundingSourceKind.SAVING,
          sourceId: saving.id,
          name: saving.productName,
          currentAmount: saving.latestCycle?.principal ?? 0,
          currency: goalCurrency,
          sourceType: "savings" as const,
        })),
      ...(accounts?.accounts ?? [])
        .filter(
          (account) =>
            account.type === AccountType.SAVINGS && !account.isArchived,
        )
        .map((account) => ({
          kind: GoalFundingSourceKind.SAVINGS_ACCOUNT,
          sourceId: account.id,
          name: account.name,
          currentAmount: account.balance,
          currency: goalCurrency,
          sourceType: "savings" as const,
        })),
      ...(portfolio?.activeHoldings ?? [])
        .filter(
          (holding) => holding.currentValue != null && holding.quantity !== "0",
        )
        .map((holding) => ({
          kind: GoalFundingSourceKind.HOLDING,
          sourceId: holding.id,
          name: holding.name,
          currentAmount: holding.currentValue ?? 0,
          currency: "VND",
          sourceType: "investments" as const,
        })),
      ...(loans ?? [])
        .filter(
          (loan) => loan.status !== "completed" && loan.remainingPrincipal > 0,
        )
        .map((loan) => ({
          kind: GoalFundingSourceKind.LOAN,
          sourceId: loan.id,
          name: loan.name,
          currentAmount: loan.remainingPrincipal,
          currency: loan.currency,
          sourceType: "debt" as const,
        })),
      ...(debts ?? [])
        .filter(
          (debt) =>
            !debt.isArchived &&
            debt.status !== "completed" &&
            debt.remainingAmount > 0,
        )
        .map((debt) => ({
          kind: GoalFundingSourceKind.DEBT,
          sourceId: debt.id,
          name: debt.name,
          currentAmount: debt.remainingAmount,
          currency: debt.currency,
          sourceType: "debt" as const,
        })),
    ];
    return options
      .filter(
        (option) =>
          !input?.goalType ||
          isGoalFundingSourceCompatible(input.goalType, option.kind),
      )
      .map((option) => {
        const linkedGoalId =
          ownerBySource.get(goalFundingSourceKey(option)) ?? null;
        const isAvailable =
          linkedGoalId == null || linkedGoalId === input?.goalId;
        return {
          ...option,
          isAvailable,
          linkedGoalId,
          availability: isAvailable ? "available" : "already_linked",
        };
      });
  } catch (error) {
    logPlanFailure(error, PLAN_OPERATION.LIST_GOAL_FUNDING_OPTIONS, {
      householdId: gate.householdId,
    });
    return null;
  }
}
