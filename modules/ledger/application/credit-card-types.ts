import {
  AccountType,
  CardBillingItemType,
  CardBillingMonthStatus,
  type AccountType as AccountTypeValue,
  type CardBillingItemType as CardBillingItemTypeValue,
  type CardBillingMonthStatus as CardBillingMonthStatusValue,
} from "./ledger-constants";
import {
  computeAvailableCredit,
  computeOutstanding,
  utilizationPercent,
} from "./credit-card-billing";

export type CreditCardSettings = {
  accountId: string;
  creditLimit: number;
  statementDay: number;
  dueDay: number;
  linkedBankAccountId: string | null;
};

export type CardBillingMonth = {
  id: string;
  cardAccountId: string;
  billingMonth: string;
  statementAmount: number;
  paidAmount: number;
  dueDate: string;
  status: CardBillingMonthStatusValue;
  remaining: number;
};

export type CardBillingItem = {
  id: string;
  billingMonthId: string;
  cardAccountId: string;
  transactionId: string | null;
  installmentPlanId: string | null;
  description: string | null;
  amount: number;
  feeAmount: number;
  itemType: CardBillingItemTypeValue;
  isPaid: boolean;
  isConvertedToInstallment: boolean;
};

export type CreditCardSummary = {
  accountId: string;
  name: string;
  type: typeof AccountType.CREDIT_CARD;
  creditLimit: number;
  statementDay: number;
  dueDay: number;
  linkedBankAccountId: string | null;
  outstanding: number;
  availableCredit: number;
  utilizationPct: number;
  nextDueDate: string | null;
};

export type CreditCardDetail = CreditCardSummary & {
  months: CardBillingMonth[];
  items: CardBillingItem[];
  linkedInstallments: Array<{
    id: string;
    name: string;
    remainingInstallments: number;
    status: string;
  }>;
};

function asBillingStatus(value: string): CardBillingMonthStatusValue {
  switch (value) {
    case CardBillingMonthStatus.PARTIAL:
    case CardBillingMonthStatus.SETTLED:
      return value;
    default:
      return CardBillingMonthStatus.OPEN;
  }
}

function asItemType(value: string): CardBillingItemTypeValue {
  return value === CardBillingItemType.INSTALLMENT
    ? CardBillingItemType.INSTALLMENT
    : CardBillingItemType.STANDARD;
}

export function mapCreditCardSettingsRow(row: {
  account_id: string;
  credit_limit: number | string;
  statement_day: number;
  due_day: number;
  linked_bank_account_id: string | null;
}): CreditCardSettings {
  const limit =
    typeof row.credit_limit === "string"
      ? Number(row.credit_limit)
      : row.credit_limit;
  return {
    accountId: row.account_id,
    creditLimit: Number.isFinite(limit) ? limit : 0,
    statementDay: row.statement_day,
    dueDay: row.due_day,
    linkedBankAccountId: row.linked_bank_account_id,
  };
}

export function mapBillingMonthRow(row: {
  id: string;
  card_account_id: string;
  billing_month: string;
  statement_amount: number | string;
  paid_amount: number | string;
  due_date: string;
  status: string;
}): CardBillingMonth {
  const statementAmount =
    typeof row.statement_amount === "string"
      ? Number(row.statement_amount)
      : row.statement_amount;
  const paidAmount =
    typeof row.paid_amount === "string"
      ? Number(row.paid_amount)
      : row.paid_amount;
  const remaining = Math.max(0, statementAmount - paidAmount);
  return {
    id: row.id,
    cardAccountId: row.card_account_id,
    billingMonth: row.billing_month.slice(0, 10),
    statementAmount: Number.isFinite(statementAmount) ? statementAmount : 0,
    paidAmount: Number.isFinite(paidAmount) ? paidAmount : 0,
    dueDate: row.due_date.slice(0, 10),
    status: asBillingStatus(row.status),
    remaining,
  };
}

export function mapBillingItemRow(row: {
  id: string;
  billing_month_id: string;
  card_account_id: string;
  transaction_id: string | null;
  installment_plan_id: string | null;
  description: string | null;
  amount: number | string;
  fee_amount: number | string;
  item_type: string;
  is_paid: boolean;
  is_converted_to_installment: boolean;
}): CardBillingItem {
  const amount =
    typeof row.amount === "string" ? Number(row.amount) : row.amount;
  const fee =
    typeof row.fee_amount === "string"
      ? Number(row.fee_amount)
      : row.fee_amount;
  return {
    id: row.id,
    billingMonthId: row.billing_month_id,
    cardAccountId: row.card_account_id,
    transactionId: row.transaction_id,
    installmentPlanId: row.installment_plan_id,
    description: row.description,
    amount: Number.isFinite(amount) ? amount : 0,
    feeAmount: Number.isFinite(fee) ? fee : 0,
    itemType: asItemType(row.item_type),
    isPaid: Boolean(row.is_paid),
    isConvertedToInstallment: Boolean(row.is_converted_to_installment),
  };
}

export function buildCreditCardSummary(input: {
  accountId: string;
  name: string;
  settings: CreditCardSettings;
  months: CardBillingMonth[];
}): CreditCardSummary {
  const outstanding = computeOutstanding(input.months);
  const availableCredit = computeAvailableCredit(
    input.settings.creditLimit,
    outstanding,
  );
  const openMonths = input.months
    .filter(
      (m) => m.status !== CardBillingMonthStatus.SETTLED && m.remaining > 0,
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return {
    accountId: input.accountId,
    name: input.name,
    type: AccountType.CREDIT_CARD,
    creditLimit: input.settings.creditLimit,
    statementDay: input.settings.statementDay,
    dueDay: input.settings.dueDay,
    linkedBankAccountId: input.settings.linkedBankAccountId,
    outstanding,
    availableCredit,
    utilizationPct: utilizationPercent(input.settings.creditLimit, outstanding),
    nextDueDate: openMonths[0]?.dueDate ?? null,
  };
}

export function isCreditCardType(type: AccountTypeValue | string): boolean {
  return type === AccountType.CREDIT_CARD;
}
