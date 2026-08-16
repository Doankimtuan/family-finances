import {
  TRANSACTION_BALANCE_STATUS_VALUES,
  TransactionLedgerType,
  TransactionStatus,
} from "@/modules/ledger/application/ledger-constants";
import { classifyFinancialEvent } from "@/modules/ledger/application/financial-semantics";
import { JarPlanKind, type PlanJar } from "./jar-types";

export const JAR_BUDGET_NEAR_LIMIT_PERCENT = 80;
const SAVINGS_EVENT_PREFIX = "SAVINGS_";
const SAVINGS_PLACEMENT_NEEDLE = "PLACEMENT";

export type JarBudgetState =
  "healthy" | "near_limit" | "overspent" | "no_spending" | "no_budget";

export type JarBudgetTransaction = {
  id?: string;
  type: string;
  amount: number | string;
  status?: string | null;
  jar_id?: string | null;
  jarId?: string | null;
  savings_event_kind?: string | null;
  savingsEventKind?: string | null;
  reverses_transaction_id?: string | null;
  reversesTransactionId?: string | null;
  corrects_transaction_id?: string | null;
  correctsTransactionId?: string | null;
  is_loan_payment?: boolean | null;
  isLoanPayment?: boolean | null;
  is_reversal?: boolean | null;
  isReversal?: boolean | null;
};

export type JarBudgetMetrics = {
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  usagePercent: number;
  state: JarBudgetState;
  ruleBudget?: number;
  rolloverCredit?: number;
  periodAdjustment?: number;
  qualifyingIncome?: number;
  incomeSource?: QualifyingIncomeSource;
};

export type QualifyingIncomeSource =
  "configured" | "recurring_fallback" | "posted_fallback" | "none";

function numericAmount(value: number | string): number {
  const amount = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(amount) ? Math.max(0, Math.trunc(amount)) : 0;
}

function transactionStatus(transaction: JarBudgetTransaction): string | null {
  return transaction.status ?? null;
}

function transactionJarId(transaction: JarBudgetTransaction): string | null {
  return transaction.jar_id ?? transaction.jarId ?? null;
}

function transactionSavingsEventKind(
  transaction: JarBudgetTransaction,
): string | null {
  return transaction.savings_event_kind ?? transaction.savingsEventKind ?? null;
}

function transactionIsReversal(transaction: JarBudgetTransaction): boolean {
  return Boolean(
    transaction.is_reversal ??
    transaction.isReversal ??
    transaction.reverses_transaction_id ??
    transaction.reversesTransactionId,
  );
}

function transactionReversalId(
  transaction: JarBudgetTransaction,
): string | null {
  return (
    transaction.reverses_transaction_id ??
    transaction.reversesTransactionId ??
    null
  );
}

function isIncludedInLedgerMath(transaction: JarBudgetTransaction): boolean {
  const status = transactionStatus(transaction);
  if (!status) return true;
  return (TRANSACTION_BALANCE_STATUS_VALUES as readonly string[]).includes(
    status,
  );
}

function isReversedOriginal(transaction: JarBudgetTransaction): boolean {
  return transactionStatus(transaction) === TransactionStatus.REVERSED;
}

function isSavingsPlacement(transaction: JarBudgetTransaction): boolean {
  const eventKind =
    transactionSavingsEventKind(transaction)?.toUpperCase() ?? "";
  return (
    eventKind.startsWith(SAVINGS_EVENT_PREFIX) &&
    eventKind.includes(SAVINGS_PLACEMENT_NEEDLE)
  );
}

function baseEnvelopeEffect(transaction: JarBudgetTransaction): number {
  const amount = numericAmount(transaction.amount);
  if (!transactionJarId(transaction) || amount <= 0) return 0;

  switch (transaction.type) {
    case TransactionLedgerType.EXPENSE:
    case TransactionLedgerType.INVESTMENT_BUY:
    case TransactionLedgerType.INVESTMENT_FEE:
      return amount;
    case TransactionLedgerType.LIABILITY_PAYMENT:
      return (transaction.is_loan_payment ?? transaction.isLoanPayment)
        ? amount
        : 0;
    case TransactionLedgerType.TRANSFER_OUT:
    case TransactionLedgerType.TRANSFER_IN:
      return isSavingsPlacement(transaction) ? amount : 0;
    default:
      return 0;
  }
}

/**
 * Classifies one Money event as a Jar envelope effect. A positive value
 * consumes the frozen transaction.jar_id assignment; a negative value restores
 * capacity. Reversal links should be supplied when the original leg is
 * available so neutral events cannot be turned into spending by accident.
 */
export function classifyJarEnvelopeEffect(
  transaction: JarBudgetTransaction,
  reversedTransaction?: JarBudgetTransaction,
): number {
  if (!isIncludedInLedgerMath(transaction) || isReversedOriginal(transaction)) {
    return 0;
  }
  if (transactionIsReversal(transaction)) {
    if (reversedTransaction) {
      const originalEffect = baseEnvelopeEffect(reversedTransaction);
      return originalEffect > 0
        ? -Math.min(numericAmount(transaction.amount), originalEffect)
        : 0;
    }
    // Legacy fixtures and old imported rows may only carry is_reversal. The
    // Money correction/refund RPCs encode envelope-restoring legs as income or
    // expense, while generic transfers remain neutral.
    return transaction.type === TransactionLedgerType.INCOME ||
      transaction.type === TransactionLedgerType.EXPENSE
      ? -numericAmount(transaction.amount)
      : 0;
  }
  return baseEnvelopeEffect(transaction);
}

/** Posted ordinary income used by the explicit posted-income fallback. */
export function calculateQualifyingPostedIncome(
  transactions: readonly JarBudgetTransaction[],
): number {
  return Math.max(
    0,
    transactions.reduce((total, transaction) => {
      if (
        !isIncludedInLedgerMath(transaction) ||
        isReversedOriginal(transaction) ||
        transactionIsReversal(transaction) ||
        transaction.type !== TransactionLedgerType.INCOME
      ) {
        return total;
      }
      const semantics = classifyFinancialEvent(transaction);
      if (!semantics.countsTowardIncome) return total;
      return total + numericAmount(transaction.amount);
    }, 0),
  );
}

/** Backwards-compatible name used by existing Plan consumers. */
export function calculatePeriodIncome(
  transactions: readonly JarBudgetTransaction[],
): number {
  return calculateQualifyingPostedIncome(transactions);
}
export function calculateJarRuleBudget(
  jar: Pick<PlanJar, "plan">,
  qualifyingIncome: number,
): number {
  const plan = jar.plan;
  if (!plan) return 0;
  if (plan.kind === JarPlanKind.FIXED) {
    return Math.max(0, Math.trunc(plan.fixedAmount));
  }
  return Math.max(
    0,
    Math.floor(
      (Math.max(0, Math.trunc(qualifyingIncome)) * plan.percentBps) / 10_000,
    ),
  );
}

export function calculateJarBudgetAmount(
  jar: Pick<PlanJar, "plan">,
  qualifyingIncome: number,
  options?: {
    rolloverCredit?: number;
    adjustment?: number;
  },
): number {
  const ruleBudget = calculateJarRuleBudget(jar, qualifyingIncome);
  const rolloverCredit = Math.max(0, Math.trunc(options?.rolloverCredit ?? 0));
  const adjustment = Math.trunc(options?.adjustment ?? 0);
  return Math.max(0, ruleBudget + rolloverCredit + adjustment);
}

/**
 * Derives spent from the bounded period transaction fetch in one pass. The
 * transaction.jar_id assignment is used exactly as stored; current category
 * to Jar mappings are deliberately not consulted.
 */
export function calculateJarSpentAmount(
  jarId: string,
  transactions: readonly JarBudgetTransaction[],
): number {
  const byId = new Map(
    transactions.flatMap((transaction) =>
      transaction.id ? [[transaction.id, transaction] as const] : [],
    ),
  );
  const total = transactions.reduce((sum, transaction) => {
    if (transactionJarId(transaction) !== jarId) return sum;
    const reversalOf = transactionReversalId(transaction);
    const original = reversalOf ? byId.get(reversalOf) : undefined;
    return sum + classifyJarEnvelopeEffect(transaction, original);
  }, 0);
  return Math.max(0, total);
}

export function resolveJarBudgetState(input: {
  budgetAmount: number;
  spentAmount: number;
  usagePercent: number;
}): JarBudgetState {
  const { budgetAmount, spentAmount, usagePercent } = input;
  if (budgetAmount <= 0 && spentAmount > 0) return "overspent";
  if (budgetAmount <= 0) return "no_budget";
  if (spentAmount > budgetAmount) return "overspent";
  if (spentAmount <= 0) return "no_spending";
  if (usagePercent >= JAR_BUDGET_NEAR_LIMIT_PERCENT) return "near_limit";
  return "healthy";
}

export function calculateJarBudgetMetrics(
  jar: Pick<PlanJar, "plan">,
  jarId: string,
  transactions: readonly JarBudgetTransaction[],
  options?: {
    rolloverCredit?: number;
    adjustment?: number;
    periodIncome?: number;
    incomeSource?: QualifyingIncomeSource;
  },
): JarBudgetMetrics {
  const qualifyingIncome =
    options?.periodIncome ?? calculateQualifyingPostedIncome(transactions);
  const ruleBudget = calculateJarRuleBudget(jar, qualifyingIncome);
  const rolloverCredit = Math.max(0, Math.trunc(options?.rolloverCredit ?? 0));
  const periodAdjustment = Math.trunc(
    options?.adjustment ?? 0,
  );
  const budgetAmount = Math.max(
    0,
    ruleBudget + rolloverCredit + periodAdjustment,
  );
  const spentAmount = calculateJarSpentAmount(jarId, transactions);
  const remainingAmount = budgetAmount - spentAmount;
  const usagePercent =
    budgetAmount > 0 ? Math.round((spentAmount / budgetAmount) * 100) : 0;
  return {
    budgetAmount,
    spentAmount,
    remainingAmount,
    usagePercent,
    state: resolveJarBudgetState({ budgetAmount, spentAmount, usagePercent }),
    ruleBudget,
    rolloverCredit,
    periodAdjustment,
    qualifyingIncome,
    incomeSource: options?.incomeSource,
  };
}

export type QualifyingIncomeResolution = {
  amount: number;
  source: QualifyingIncomeSource;
};

export function resolveQualifyingMonthlyIncome(input: {
  configuredIncome?: number | string | null;
  recurringIncome?: number;
  postedIncome?: number;
}): QualifyingIncomeResolution {
  if (input.configuredIncome !== null && input.configuredIncome !== undefined) {
    return {
      amount: numericAmount(input.configuredIncome),
      source: "configured",
    };
  }
  const recurringIncome = numericAmount(input.recurringIncome ?? 0);
  if (recurringIncome > 0) {
    return { amount: recurringIncome, source: "recurring_fallback" };
  }
  const postedIncome = numericAmount(input.postedIncome ?? 0);
  if (postedIncome > 0) {
    return { amount: postedIncome, source: "posted_fallback" };
  }
  return { amount: 0, source: "none" };
}
