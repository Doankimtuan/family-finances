import {
  AccountType,
  type AccountType as AccountTypeValue,
} from "./ledger-constants";

export { AccountType } from "./ledger-constants";

export type LedgerAccount = {
  id: string;
  name: string;
  type: AccountTypeValue;
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

function asAccountType(value: string): AccountTypeValue {
  switch (value) {
    case AccountType.CHECKING:
    case AccountType.SAVINGS:
    case AccountType.EWALLET:
    case AccountType.BROKERAGE:
    case AccountType.OTHER:
      return value;
    default:
      return AccountType.CASH;
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
