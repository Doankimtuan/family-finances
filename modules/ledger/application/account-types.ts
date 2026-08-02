export type AccountType =
  "cash" | "checking" | "savings" | "ewallet" | "brokerage" | "other";

export type LedgerAccount = {
  id: string;
  name: string;
  type: AccountType;
  /** Minor-unit integer (VND whole đồng). Real ledger position for this account. */
  balance: number;
  isArchived: boolean;
};

export type RealPosition = {
  householdId: string;
  currency: string;
  /** Sum of active account ledger balances (BR-01). */
  totalBalance: number;
  accounts: LedgerAccount[];
};

function asAccountType(value: string): AccountType {
  switch (value) {
    case "checking":
    case "savings":
    case "ewallet":
    case "brokerage":
    case "other":
      return value;
    default:
      return "cash";
  }
}

export function mapAccountRow(row: {
  id: string;
  name: string;
  type: string;
  opening_balance: number | string;
  is_archived: boolean;
}): LedgerAccount {
  const balance =
    typeof row.opening_balance === "string"
      ? Number(row.opening_balance)
      : row.opening_balance;
  return {
    id: row.id,
    name: row.name,
    type: asAccountType(row.type),
    balance: Number.isFinite(balance) ? balance : 0,
    isArchived: Boolean(row.is_archived),
  };
}
