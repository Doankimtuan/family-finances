import { classifyFinancialEvent } from "@/modules/ledger/application/financial-semantics";
import {
  TRANSACTION_BALANCE_STATUS_VALUES,
  TransactionLedgerType,
  TransactionStatus,
} from "@/modules/ledger/application/ledger-constants";
import {
  JarBudgetState,
  QualifyingIncomeSource,
  type JarBudgetState as JarBudgetStateValue,
  type QualifyingIncomeSource as QualifyingIncomeSourceValue,
} from "./plan-constants";
import { JarPlanKind, type JarPlan, type PlanJar } from "./jar-types";

export const JAR_BUDGET_NEAR_LIMIT_PERCENT = 80;
const SAVINGS_EVENT_PREFIX = "SAVINGS_";
const SAVINGS_PLACEMENT_NEEDLE = "PLACEMENT";

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
  state: JarBudgetStateValue;
  ruleBudget?: number;
  rolloverCredit?: number;
  periodAdjustment?: number;
  qualifyingIncome?: number;
  incomeSource?: QualifyingIncomeSourceValue;
};

export type QualifyingIncomeResolution = {
  amount: number;
  source: QualifyingIncomeSourceValue;
};

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
type JarRuleBudgetInput = JarPlan | Pick<PlanJar, "plan"> | null | undefined;

export function calculateJarRuleBudget(
  input: JarRuleBudgetInput,
  qualifyingIncome: number,
): number {
  const plan = input && "plan" in input ? input.plan : input;
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
}): JarBudgetStateValue {
  const { budgetAmount, spentAmount, usagePercent } = input;
  if (budgetAmount <= 0 && spentAmount > 0) return JarBudgetState.OVERSPENT;
  if (budgetAmount <= 0) return JarBudgetState.NO_BUDGET;
  if (spentAmount > budgetAmount) return JarBudgetState.OVERSPENT;
  if (spentAmount <= 0) return JarBudgetState.NO_SPENDING;
  if (usagePercent >= JAR_BUDGET_NEAR_LIMIT_PERCENT) return JarBudgetState.NEAR_LIMIT;
  return JarBudgetState.HEALTHY;
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

export function resolveQualifyingMonthlyIncome(input: {
  configuredIncome?: number | string | null;
  recurringIncome?: number;
  postedIncome?: number;
}): QualifyingIncomeResolution {
  if (input.configuredIncome !== null && input.configuredIncome !== undefined) {
    return {
      amount: numericAmount(input.configuredIncome),
      source: QualifyingIncomeSource.CONFIGURED,
    };
  }
  const recurringIncome = numericAmount(input.recurringIncome ?? 0);
  if (recurringIncome > 0) {
    return { amount: recurringIncome, source: QualifyingIncomeSource.RECURRING_FALLBACK };
  }
  const postedIncome = numericAmount(input.postedIncome ?? 0);
  if (postedIncome > 0) {
    return { amount: postedIncome, source: QualifyingIncomeSource.POSTED_FALLBACK };
  }
  return { amount: 0, source: QualifyingIncomeSource.NONE };
}

export {
  JarBudgetState,
  QualifyingIncomeSource,
  JAR_BUDGET_STATE_VALUES,
  QUALIFYING_INCOME_SOURCE_VALUES,
} from "./plan-constants";
