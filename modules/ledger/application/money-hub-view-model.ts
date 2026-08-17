import type { CreditCardSummary } from "./credit-card-types";
import type { LedgerAccount, RealPosition } from "./account-types";
import {
  ACCOUNT_TYPE_LIQUID_VALUES,
  AccountType,
  CARD_UTILIZATION_DANGER_PCT,
  type AccountType as AccountTypeValue,
} from "./ledger-constants";
import { differenceInUtcCalendarDays } from "@/shared/utils/iso-date";

export const MONEY_HUB_INITIAL_ACCOUNT_ROW_LIMIT = 4;
export const MONEY_HUB_DUE_SOON_DAYS = 7;
const PERCENTAGE_SCALE = 100;

export const MoneyAccountGroupKey = {
  CASH: "cash",
  BANK: "bank",
  WALLET: "wallet",
  SAVINGS: "savings",
  INVESTMENT: "investment",
  OTHER: "other",
} as const;

export type MoneyAccountGroupKey =
  (typeof MoneyAccountGroupKey)[keyof typeof MoneyAccountGroupKey];

export const MoneyCreditAttention = {
  OVERDUE: "overdue",
  DUE_SOON: "due_soon",
  HIGH_UTILIZATION: "high_utilization",
} as const;

export type MoneyCreditAttention =
  (typeof MoneyCreditAttention)[keyof typeof MoneyCreditAttention];

export type MoneyHubAccount = LedgerAccount & {
  groupKey: MoneyAccountGroupKey;
};

export type MoneyHubAccountGroup = {
  key: MoneyAccountGroupKey;
  accounts: MoneyHubAccount[];
};

export type MoneyHubCompositionSegment = {
  key: MoneyAccountGroupKey;
  balance: number;
  share: number;
  percentage: number;
  isLessThanOnePercent: boolean;
};

export type MoneyHubCreditCard = CreditCardSummary & {
  utilizationForDisplay: number | null;
  progressValue: number | null;
  attention: MoneyCreditAttention | null;
};

export type MoneyHubViewModel = {
  currency: string;
  totalOwnedBalance: number;
  activeAccountCount: number;
  accountGroups: MoneyHubAccountGroup[];
  initialAccountGroups: MoneyHubAccountGroup[];
  accountPresentation: "flat" | "grouped";
  hasMoreAccounts: boolean;
  composition: MoneyHubCompositionSegment[];
  creditCards: MoneyHubCreditCard[];
  totalCreditOutstanding: number;
};

const ACCOUNT_GROUP_BY_TYPE: Record<AccountTypeValue, MoneyAccountGroupKey> = {
  [AccountType.CASH]: MoneyAccountGroupKey.CASH,
  [AccountType.CHECKING]: MoneyAccountGroupKey.BANK,
  [AccountType.SAVINGS]: MoneyAccountGroupKey.SAVINGS,
  [AccountType.EWALLET]: MoneyAccountGroupKey.WALLET,
  [AccountType.BROKERAGE]: MoneyAccountGroupKey.INVESTMENT,
  [AccountType.CREDIT_CARD]: MoneyAccountGroupKey.OTHER,
  [AccountType.SAVINGS_PRODUCT]: MoneyAccountGroupKey.SAVINGS,
  [AccountType.OTHER]: MoneyAccountGroupKey.OTHER,
};

const MONEY_ACCOUNT_GROUP_ORDER: readonly MoneyAccountGroupKey[] = [
  MoneyAccountGroupKey.CASH,
  MoneyAccountGroupKey.BANK,
  MoneyAccountGroupKey.WALLET,
  MoneyAccountGroupKey.SAVINGS,
  MoneyAccountGroupKey.INVESTMENT,
  MoneyAccountGroupKey.OTHER,
] as const;

const MONEY_ACCOUNT_TYPE_PRIORITY: Record<AccountTypeValue, number> = {
  [AccountType.CASH]: 0,
  [AccountType.CHECKING]: 1,
  [AccountType.EWALLET]: 2,
  [AccountType.SAVINGS]: 3,
  [AccountType.BROKERAGE]: 4,
  [AccountType.OTHER]: 5,
  [AccountType.SAVINGS_PRODUCT]: 6,
  [AccountType.CREDIT_CARD]: 7,
};

function creditAttentionFor(card: CreditCardSummary, today: Date) {
  if (card.nextDueDate && card.nextDueRemaining > 0) {
    const daysUntilDue = differenceInUtcCalendarDays(today, card.nextDueDate);
    if (daysUntilDue < 0) return MoneyCreditAttention.OVERDUE;
    if (daysUntilDue <= MONEY_HUB_DUE_SOON_DAYS) {
      return MoneyCreditAttention.DUE_SOON;
    }
  }

  return card.creditLimit > 0 &&
    card.utilizationPct >= CARD_UTILIZATION_DANGER_PCT
    ? MoneyCreditAttention.HIGH_UTILIZATION
    : null;
}

function accountComparator(left: MoneyHubAccount, right: MoneyHubAccount) {
  const typeDifference =
    MONEY_ACCOUNT_TYPE_PRIORITY[left.type] -
    MONEY_ACCOUNT_TYPE_PRIORITY[right.type];
  if (typeDifference !== 0) return typeDifference;

  const balanceDifference = right.balance - left.balance;
  if (balanceDifference !== 0) return balanceDifference;

  return left.name.localeCompare(right.name);
}

function toMoneyHubAccount(account: LedgerAccount): MoneyHubAccount {
  return {
    ...account,
    groupKey: ACCOUNT_GROUP_BY_TYPE[account.type],
  };
}

function buildGroups(accounts: MoneyHubAccount[]) {
  const accountsByGroup = new Map<MoneyAccountGroupKey, MoneyHubAccount[]>();
  for (const account of accounts) {
    const group = accountsByGroup.get(account.groupKey) ?? [];
    group.push(account);
    accountsByGroup.set(account.groupKey, group);
  }

  return MONEY_ACCOUNT_GROUP_ORDER.flatMap((key) => {
    const group = accountsByGroup.get(key);
    return group?.length ? [{ key, accounts: group }] : [];
  });
}

function groupsForInitialRows(groups: MoneyHubAccountGroup[]) {
  let remaining = MONEY_HUB_INITIAL_ACCOUNT_ROW_LIMIT;
  return groups.flatMap((group) => {
    if (remaining <= 0) return [];
    const accounts = group.accounts.slice(0, remaining);
    remaining -= accounts.length;
    return accounts.length ? [{ ...group, accounts }] : [];
  });
}

function compositionFor(groups: MoneyHubAccountGroup[]) {
  const segments = groups.flatMap((group) => {
    const positiveBalance = group.accounts.reduce(
      (sum, account) => sum + Math.max(account.balance, 0),
      0,
    );
    return positiveBalance > 0
      ? [{ key: group.key, balance: positiveBalance }]
      : [];
  });
  const positiveBalanceTotal = segments.reduce(
    (sum, segment) => sum + segment.balance,
    0,
  );
  if (positiveBalanceTotal <= 0) return [];

  const rounded = segments.map((segment, index) => {
    const share = segment.balance / positiveBalanceTotal;
    const rawPercentage = share * PERCENTAGE_SCALE;
    return {
      ...segment,
      index,
      share,
      percentage: Math.floor(rawPercentage),
      remainder: rawPercentage - Math.floor(rawPercentage),
    };
  });
  const remainingPercentage =
    PERCENTAGE_SCALE -
    rounded.reduce((sum, segment) => sum + segment.percentage, 0);

  for (const segment of [...rounded]
    .sort(
      (left, right) =>
        right.remainder - left.remainder || left.index - right.index,
    )
    .slice(0, remainingPercentage)) {
    segment.percentage += 1;
  }

  return rounded.map(({ key, balance, share, percentage }) => ({
    key,
    balance,
    share,
    percentage,
    isLessThanOnePercent: percentage === 0,
  }));
}

/** True only for real, user-controlled asset accounts eligible for Money's owned total. */
export function isMoneyHubAssetAccount(account: LedgerAccount) {
  return ACCOUNT_TYPE_LIQUID_VALUES.some((type) => type === account.type);
}

/**
 * Financial presentation data for Money. This is intentionally pure: all account
 * aggregation, grouping, credit-card state, and attention calculations happen
 * before rendering rather than inside page JSX.
 */
export function createMoneyHubViewModel(input: {
  position: RealPosition;
  creditCards: CreditCardSummary[];
  today?: Date;
}): MoneyHubViewModel {
  const accounts = input.position.accounts
    .filter((account) => !account.isArchived && isMoneyHubAssetAccount(account))
    .map(toMoneyHubAccount)
    .sort(accountComparator);
  const totalOwnedBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );
  const accountGroups = buildGroups(accounts);
  const creditCards = input.creditCards.map((card) => ({
    ...card,
    utilizationForDisplay: card.creditLimit > 0 ? card.utilizationPct : null,
    progressValue:
      card.creditLimit > 0 ? Math.min(card.utilizationPct, 100) : null,
    attention: creditAttentionFor(card, input.today ?? new Date()),
  }));

  return {
    currency: input.position.currency,
    totalOwnedBalance,
    activeAccountCount: accounts.length,
    accountGroups,
    initialAccountGroups: groupsForInitialRows(accountGroups),
    accountPresentation: accountGroups.length > 1 ? "grouped" : "flat",
    hasMoreAccounts: accounts.length > MONEY_HUB_INITIAL_ACCOUNT_ROW_LIMIT,
    composition: compositionFor(accountGroups),
    creditCards,
    totalCreditOutstanding: creditCards.reduce(
      (sum, card) => sum + card.outstanding,
      0,
    ),
  };
}
