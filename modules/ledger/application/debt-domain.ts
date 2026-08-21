import {
  DebtCreationMode,
  DebtDirection,
  DebtDueState,
  DebtPaymentDirection,
  DebtProgressState,
  DebtStatus,
  DEBT_DUE_SOON_DAYS,
  DEBT_NO_DUE_SORT_DATE,
  type DebtCreationMode as DebtCreationModeValue,
  type DebtDirection as DebtDirectionValue,
  type DebtDueState as DebtDueStateValue,
  type DebtPaymentDirection as DebtPaymentDirectionValue,
  type DebtProgressState as DebtProgressStateValue,
  type DebtStatus as DebtStatusValue,
} from "./ledger-constants";
import type { FinancialCapabilities } from "@/modules/shared-kernel/application/financial-ownership";
import {
  FINANCIAL_SCOPE,
  isFinancialScope,
} from "@/modules/shared-kernel/application/financial-scope";
import { resolveFinancialCapabilities } from "@/modules/shared-kernel/application/financial-ownership";

const DAY_IN_MILLISECONDS = 86_400_000;

export type Debt = {
  id: string;
  name: string;
  counterparty: string;
  principalAmount: number;
  remainingAmount: number;
  openingPaidAmount: number;
  currency: string;
  direction: DebtDirectionValue;
  creationMode: DebtCreationModeValue;
  startDate: string;
  dueDate: string | null;
  note: string | null;
  status: DebtStatusValue;
  originAccountId: string | null;
  originTransactionId: string | null;
  isArchived: boolean;
  ownership: FinancialCapabilities;
};

export type DebtPayment = {
  id: string;
  debtId: string;
  accountId: string;
  accountName: string | null;
  transactionId: string;
  amount: number;
  direction: DebtPaymentDirectionValue;
  effectiveDate: string;
  note: string | null;
};

export type DebtProgress = {
  paidAmount: number;
  remainingAmount: number;
  percent: number;
  state: DebtProgressStateValue;
};

export type DebtPaymentReconciliation = {
  derivedPaidAmount: number;
  recordedPaidAmount: number;
  openingPaidAmount: number;
  unallocatedPaidAmount: number;
  isReconciled: boolean;
};

export type DebtDue = {
  state: DebtDueStateValue;
  daysUntilDue: number | null;
};

export type DebtSummary = {
  totalBorrowed: number;
  totalLent: number;
  activeCount: number;
  overdueCount: number;
  dueSoonCount: number;
};

export type DebtViewModel = Debt & {
  dueState: DebtDueStateValue;
  due: DebtDue;
  progress: DebtProgress;
};

function asWholeMoney(value: number | string | null | undefined): number {
  const numeric = typeof value === "string" ? Number(value) : value;
  return typeof numeric === "number" && Number.isFinite(numeric)
    ? Math.trunc(numeric)
    : 0;
}

function ymdToUtc(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function asDebtDirection(value: string | null | undefined): DebtDirectionValue {
  return value === DebtDirection.LENT
    ? DebtDirection.LENT
    : DebtDirection.BORROWED;
}

function asDebtCreationMode(
  value: string | null | undefined,
): DebtCreationModeValue {
  return value === DebtCreationMode.MONEY_MOVED
    ? DebtCreationMode.MONEY_MOVED
    : DebtCreationMode.EXISTING_BALANCE;
}

function resolveDebtStatus(
  row: {
    is_archived: boolean;
    status?: string | null;
  },
  remainingAmount: number,
): DebtStatusValue {
  if (row.is_archived || row.status === DebtStatus.ARCHIVED) {
    return DebtStatus.ARCHIVED;
  }
  if (remainingAmount === 0 || row.status === DebtStatus.COMPLETED) {
    return DebtStatus.COMPLETED;
  }
  return DebtStatus.ACTIVE;
}

function asDebtPaymentDirection(value: string): DebtPaymentDirectionValue {
  return value === DebtPaymentDirection.RECEIVE_LENT
    ? DebtPaymentDirection.RECEIVE_LENT
    : DebtPaymentDirection.REPAY_BORROWED;
}

function debtProgressPercent(
  principal: number,
  paidAmount: number,
  remainingAmount: number,
): number {
  if (principal === 0 || paidAmount <= 0) return 0;
  if (remainingAmount === 0) return 100;
  return Math.min(99, Math.max(1, Math.round((paidAmount / principal) * 100)));
}

function debtProgressState(
  paidAmount: number,
  remainingAmount: number,
): DebtProgressStateValue {
  if (remainingAmount === 0) return DebtProgressState.COMPLETED;
  if (paidAmount === 0) return DebtProgressState.NOT_STARTED;
  return DebtProgressState.IN_PROGRESS;
}

export function mapDebtRow(
  row: {
    id: string;
    name: string;
    creditor: string | null;
    principal_amount: number | string;
    remaining_amount: number | string;
    opening_paid_amount?: number | string | null;
    currency: string;
    direction?: string | null;
    creation_mode?: string | null;
    start_date?: string | null;
    due_date?: string | null;
    note: string | null;
    status?: string | null;
    origin_account_id?: string | null;
    origin_transaction_id?: string | null;
    is_archived: boolean;
    financial_scope?: string | null;
    owner_membership_id?: string | null;
  },
  activeMembershipId = "",
  activeMembershipIds?: ReadonlySet<string>,
): Debt {
  const remainingAmount = Math.max(0, asWholeMoney(row.remaining_amount));
  const principalAmount = Math.max(
    remainingAmount,
    asWholeMoney(row.principal_amount),
  );
  const openingPaidAmount = Math.min(
    principalAmount,
    Math.max(0, asWholeMoney(row.opening_paid_amount)),
  );
  const rawFinancialScope = row.financial_scope ?? "";
  const financialScope = isFinancialScope(rawFinancialScope)
    ? rawFinancialScope
    : FINANCIAL_SCOPE.HOUSEHOLD;
  return {
    id: row.id,
    name: row.name,
    counterparty: row.creditor?.trim() || row.name,
    principalAmount,
    remainingAmount,
    openingPaidAmount,
    currency: row.currency,
    direction: asDebtDirection(row.direction),
    creationMode: asDebtCreationMode(row.creation_mode),
    startDate: row.start_date ?? "",
    dueDate: row.due_date ?? null,
    note: row.note,
    status: resolveDebtStatus(row, remainingAmount),
    originAccountId: row.origin_account_id ?? null,
    originTransactionId: row.origin_transaction_id ?? null,
    isArchived: row.is_archived,
    ownership: resolveFinancialCapabilities(
      {
        financialScope,
        ownerMembershipId: row.owner_membership_id ?? null,
      },
      activeMembershipId,
      activeMembershipIds == null || row.owner_membership_id == null
        ? true
        : activeMembershipIds.has(row.owner_membership_id),
    ),
  };
}

export function mapDebtPaymentRow(row: {
  id: string;
  liability_id: string;
  account_id: string;
  transaction_id: string;
  amount: number | string;
  payment_direction: string;
  effective_date: string;
  note: string | null;
  accounts?: { name: string } | { name: string }[] | null;
}): DebtPayment {
  const account = Array.isArray(row.accounts) ? row.accounts[0] : row.accounts;
  return {
    id: row.id,
    debtId: row.liability_id,
    accountId: row.account_id,
    accountName: account?.name ?? null,
    transactionId: row.transaction_id,
    amount: asWholeMoney(row.amount),
    direction: asDebtPaymentDirection(row.payment_direction),
    effectiveDate: row.effective_date,
    note: row.note,
  };
}

export function getDebtProgress(
  debt: Pick<Debt, "principalAmount" | "remainingAmount">,
): DebtProgress {
  const principal = Math.max(0, debt.principalAmount);
  const remainingAmount = Math.max(
    0,
    Math.min(principal, debt.remainingAmount),
  );
  const paidAmount = Math.max(0, principal - remainingAmount);
  return {
    paidAmount,
    remainingAmount,
    percent: debtProgressPercent(principal, paidAmount, remainingAmount),
    state: debtProgressState(paidAmount, remainingAmount),
  };
}

export function getDebtPaymentReconciliation(
  debt: Pick<Debt, "principalAmount" | "remainingAmount" | "openingPaidAmount">,
  payments: Pick<DebtPayment, "amount">[],
): DebtPaymentReconciliation {
  const derivedPaidAmount = getDebtProgress(debt).paidAmount;
  const recordedPaidAmount = payments.reduce(
    (total, payment) => total + Math.max(0, payment.amount),
    0,
  );
  const openingPaidAmount = Math.max(0, debt.openingPaidAmount);
  const unallocatedPaidAmount = Math.max(
    0,
    derivedPaidAmount - openingPaidAmount - recordedPaidAmount,
  );
  return {
    derivedPaidAmount,
    recordedPaidAmount,
    openingPaidAmount,
    unallocatedPaidAmount,
    isReconciled:
      unallocatedPaidAmount === 0 &&
      openingPaidAmount + recordedPaidAmount === derivedPaidAmount,
  };
}

export function getDebtDueInfo(
  debt: Pick<Debt, "dueDate" | "status" | "remainingAmount">,
  today: string,
): DebtDue {
  if (debt.status !== DebtStatus.ACTIVE || debt.remainingAmount <= 0) {
    return { state: DebtDueState.COMPLETED, daysUntilDue: null };
  }
  if (debt.dueDate == null) {
    return { state: DebtDueState.NONE, daysUntilDue: null };
  }
  const daysUntilDue = Math.round(
    (ymdToUtc(debt.dueDate) - ymdToUtc(today)) / DAY_IN_MILLISECONDS,
  );
  if (daysUntilDue < 0) {
    return { state: DebtDueState.OVERDUE, daysUntilDue };
  }
  if (daysUntilDue === 0) {
    return { state: DebtDueState.DUE_TODAY, daysUntilDue };
  }
  if (daysUntilDue <= DEBT_DUE_SOON_DAYS) {
    return { state: DebtDueState.DUE_SOON, daysUntilDue };
  }
  return { state: DebtDueState.UPCOMING, daysUntilDue };
}

export function getDebtDueState(
  debt: Pick<Debt, "dueDate" | "status" | "remainingAmount">,
  today: string,
): DebtDueStateValue {
  return getDebtDueInfo(debt, today).state;
}

export function buildDebtSummary(debts: Debt[], today: string): DebtSummary {
  return debts.reduce<DebtSummary>(
    (summary, debt) => {
      if (debt.status !== DebtStatus.ACTIVE) {
        return summary;
      }
      const dueState = getDebtDueState(debt, today);
      if (debt.direction === DebtDirection.BORROWED) {
        summary.totalBorrowed += debt.remainingAmount;
      } else {
        summary.totalLent += debt.remainingAmount;
      }
      summary.activeCount += 1;
      if (dueState === DebtDueState.OVERDUE) {
        summary.overdueCount += 1;
      }
      if (
        dueState === DebtDueState.DUE_SOON ||
        dueState === DebtDueState.DUE_TODAY
      ) {
        summary.dueSoonCount += 1;
      }
      return summary;
    },
    {
      totalBorrowed: 0,
      totalLent: 0,
      activeCount: 0,
      overdueCount: 0,
      dueSoonCount: 0,
    },
  );
}

const DEBT_DUE_PRIORITY: Record<DebtDueStateValue, number> = {
  [DebtDueState.OVERDUE]: 0,
  [DebtDueState.DUE_TODAY]: 1,
  [DebtDueState.DUE_SOON]: 2,
  [DebtDueState.UPCOMING]: 3,
  [DebtDueState.NONE]: 4,
  [DebtDueState.COMPLETED]: 5,
};

export function buildDebtViewModels(
  debts: Debt[],
  today: string,
): DebtViewModel[] {
  return debts
    .map((debt) => {
      const due = getDebtDueInfo(debt, today);
      return {
        ...debt,
        dueState: due.state,
        due,
        progress: getDebtProgress(debt),
      };
    })
    .sort((left, right) => {
      const stateDifference =
        DEBT_DUE_PRIORITY[left.dueState] - DEBT_DUE_PRIORITY[right.dueState];
      if (stateDifference !== 0) {
        return stateDifference;
      }
      return (left.dueDate ?? DEBT_NO_DUE_SORT_DATE).localeCompare(
        right.dueDate ?? DEBT_NO_DUE_SORT_DATE,
      );
    });
}

export type DebtPaymentReview = {
  paymentAmount: number;
  remainingAfterPayment: number;
  completesDebt: boolean;
};

/** Prepares the financial effect displayed before recording a principal payment. */
export function buildDebtPaymentReview(
  remainingAmount: number,
  paymentAmount: number,
): DebtPaymentReview {
  const remainingAfterPayment = Math.max(0, remainingAmount - paymentAmount);
  return {
    paymentAmount,
    remainingAfterPayment,
    completesDebt: remainingAfterPayment === 0,
  };
}
