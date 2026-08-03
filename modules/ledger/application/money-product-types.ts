/**
 * Debts / savings / installments domain types (ST-E04-004).
 * Owed and product amounts are never unlabeled bank Balance (BR-01).
 */

export const LiabilityStatus = {
  OPEN: "open",
  PAID: "paid",
} as const;

export type LiabilityStatus =
  (typeof LiabilityStatus)[keyof typeof LiabilityStatus];

export type Liability = {
  id: string;
  name: string;
  creditor: string | null;
  principalAmount: number;
  remainingAmount: number;
  currency: string;
  dueDay: number | null;
  note: string | null;
  isArchived: boolean;
  status: LiabilityStatus;
};

export const SavingsProductStatus = {
  ACTIVE: "active",
  MATURED: "matured",
  CLOSED: "closed",
} as const;

export type SavingsProductStatus =
  (typeof SavingsProductStatus)[keyof typeof SavingsProductStatus];

export type SavingsProduct = {
  id: string;
  name: string;
  principalAmount: number;
  currency: string;
  maturityDate: string;
  status: SavingsProductStatus;
  note: string | null;
  isMaturityDue: boolean;
};

export const InstallmentPlanStatus = {
  ACTIVE: "active",
  COMPLETED: "completed",
} as const;

export type InstallmentPlanStatus =
  (typeof InstallmentPlanStatus)[keyof typeof InstallmentPlanStatus];

export type InstallmentPlan = {
  id: string;
  name: string;
  cardLabel: string | null;
  totalAmount: number;
  installmentAmount: number;
  currency: string;
  numInstallments: number;
  paidInstallments: number;
  status: InstallmentPlanStatus;
  note: string | null;
  remainingInstallments: number;
};

export function mapLiabilityRow(row: {
  id: string;
  name: string;
  creditor: string | null;
  principal_amount: number | string;
  remaining_amount: number | string;
  currency: string;
  due_day: number | null;
  note: string | null;
  is_archived: boolean;
}): Liability {
  const remaining =
    typeof row.remaining_amount === "string"
      ? Number(row.remaining_amount)
      : Number(row.remaining_amount);
  return {
    id: row.id,
    name: row.name,
    creditor: row.creditor,
    principalAmount:
      typeof row.principal_amount === "string"
        ? Number(row.principal_amount)
        : Number(row.principal_amount),
    remainingAmount: remaining,
    currency: row.currency.toUpperCase(),
    dueDay: row.due_day,
    note: row.note,
    isArchived: row.is_archived,
    status:
      remaining <= 0 || row.is_archived
        ? LiabilityStatus.PAID
        : LiabilityStatus.OPEN,
  };
}

export function mapSavingsRow(row: {
  id: string;
  name: string;
  principal_amount: number | string;
  currency: string;
  maturity_date: string;
  status: string;
  note: string | null;
}): SavingsProduct {
  const status =
    row.status === SavingsProductStatus.MATURED
      ? SavingsProductStatus.MATURED
      : row.status === SavingsProductStatus.CLOSED
        ? SavingsProductStatus.CLOSED
        : SavingsProductStatus.ACTIVE;
  const maturityDate = row.maturity_date;
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: row.id,
    name: row.name,
    principalAmount:
      typeof row.principal_amount === "string"
        ? Number(row.principal_amount)
        : Number(row.principal_amount),
    currency: row.currency.toUpperCase(),
    maturityDate,
    status,
    note: row.note,
    isMaturityDue:
      status === SavingsProductStatus.ACTIVE && maturityDate <= today,
  };
}

export function mapInstallmentRow(row: {
  id: string;
  name: string;
  card_label: string | null;
  total_amount: number | string;
  installment_amount: number | string;
  currency: string;
  num_installments: number;
  paid_installments: number;
  status: string;
  note: string | null;
}): InstallmentPlan {
  const num = Number(row.num_installments);
  const paid = Number(row.paid_installments);
  const status =
    row.status === InstallmentPlanStatus.COMPLETED || paid >= num
      ? InstallmentPlanStatus.COMPLETED
      : InstallmentPlanStatus.ACTIVE;
  return {
    id: row.id,
    name: row.name,
    cardLabel: row.card_label,
    totalAmount:
      typeof row.total_amount === "string"
        ? Number(row.total_amount)
        : Number(row.total_amount),
    installmentAmount:
      typeof row.installment_amount === "string"
        ? Number(row.installment_amount)
        : Number(row.installment_amount),
    currency: row.currency.toUpperCase(),
    numInstallments: num,
    paidInstallments: paid,
    status,
    note: row.note,
    remainingInstallments: Math.max(0, num - paid),
  };
}
