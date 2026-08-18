import {
  AccountType,
  ACCOUNT_TYPE_VALUES,
  type AccountType as AccountTypeValue,
} from "./ledger-constants";
import {
  FINANCIAL_SCOPE,
  isFinancialScope,
  type FinancialScope,
} from "@/modules/shared-kernel/application/financial-scope";
import { resolveFinancialCapabilities } from "@/modules/shared-kernel/application/financial-ownership";

export { AccountType } from "./ledger-constants";

const KNOWN_ACCOUNT_TYPES = new Set<string>(ACCOUNT_TYPE_VALUES);

export type LedgerAccount = {
  id: string;
  name: string;
  type: AccountTypeValue;
  /** Minor-unit integer (VND whole đồng). Real ledger position for this account. */
  balance: number;
  isArchived: boolean;
  financialScope: FinancialScope;
  ownerMembershipId: string | null;
  isPersonal: boolean;
  isOwnedByMe: boolean;
  canMutate: boolean;
};

export type RealPosition = {
  householdId: string;
  currency: string;
  /** Sum of active account ledger balances (BR-01). */
  totalBalance: number;
  accounts: LedgerAccount[];
};

function asAccountType(value: string): AccountTypeValue {
  if (KNOWN_ACCOUNT_TYPES.has(value)) {
    return value as AccountTypeValue;
  }
  return AccountType.CASH;
}

export function mapAccountRow(
  row: {
    id: string;
    name: string;
    type: string;
    opening_balance: number | string;
    is_archived: boolean;
    financial_scope?: string | null;
    owner_membership_id?: string | null;
  },
  activeMembershipId?: string,
): LedgerAccount {
  const rawFinancialScope = row.financial_scope ?? "";
  const financialScope = isFinancialScope(rawFinancialScope)
    ? rawFinancialScope
    : FINANCIAL_SCOPE.HOUSEHOLD;
  const ownership = resolveFinancialCapabilities(
    {
      financialScope,
      ownerMembershipId: row.owner_membership_id ?? null,
    },
    activeMembershipId ?? "",
  );
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
    ...ownership,
  };
}
