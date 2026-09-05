import type { CreditCardSummary } from "./credit-card-types";
import type { LedgerAccount, RealPosition } from "./account-types";
import {
  ACCOUNT_TYPE_LIQUID_VALUES,
  AccountType,
  CARD_UTILIZATION_DANGER_PCT,
  MoneyAssetAllocationKey,
  MoneyAssetOverviewStatus,
  type AccountType as AccountTypeValue,
} from "./ledger-constants";
import { LoanDueState, LoanStatus } from "./loan-constants";
import { getLoanDueState } from "./loan-due-state";
import type { LoanSummaryRow } from "./queries/list-money-products";
import type { InvestmentHomeSummary } from "@/modules/investments/application/queries/investment-queries";
import { INVESTMENT_REPORTING_CURRENCY } from "@/modules/investments/application/investment-constants";
import {
  differenceInUtcCalendarDays,
  todayIsoDate,
} from "@/shared/utils/iso-date";

export {
  MoneyAssetAllocationKey,
  MoneyAssetOverviewStatus,
} from "./ledger-constants";

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

export const MoneyReadStatus = {
  READY: "ready",
  UNAVAILABLE: "unavailable",
} as const;

export type MoneyReadState<T> =
  | { status: typeof MoneyReadStatus.READY; data: T }
  | { status: typeof MoneyReadStatus.UNAVAILABLE };

export function toMoneyReadState<T>(value: T | null): MoneyReadState<T> {
  return value == null
    ? { status: MoneyReadStatus.UNAVAILABLE }
    : { status: MoneyReadStatus.READY, data: value };
}

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

export type MoneyAssetAllocationSegment = {
  key: MoneyAssetAllocationKey;
  amount: number;
  share: number;
  percentage: number;
  isLessThanOnePercent: boolean;
};

export type MoneyAssetOverview =
  | { status: typeof MoneyAssetOverviewStatus.UNAVAILABLE }
  | {
      status:
        | typeof MoneyAssetOverviewStatus.COMPLETE
        | typeof MoneyAssetOverviewStatus.PARTIAL;
      total: number;
      allocation: MoneyAssetAllocationSegment[];
      investmentCoverage: { included: number; total: number };
    };

export type MoneyHubCreditCard = CreditCardSummary & {
  utilizationForDisplay: number | null;
  progressValue: number | null;
  attention: MoneyCreditAttention | null;
};

export type MoneyHubInvestmentSummary = Pick<
  InvestmentHomeSummary,
  | "activeCount"
  | "marketValue"
  | "valuationQuality"
  | "valuationIncluded"
  | "valuationTotal"
>;

export type MoneyHubViewModel = {
  currency: string;
  totalOwnedBalance: number;
  activeAccountCount: number;
  accountGroups: MoneyHubAccountGroup[];
  initialAccountGroups: MoneyHubAccountGroup[];
  accountPresentation: "flat" | "grouped";
  hasMoreAccounts: boolean;
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

/** Canonical credit-card attention state (overdue / due soon / high utilization). */
export function creditCardAttentionFor(
  card: CreditCardSummary,
  today: Date,
): MoneyCreditAttention | null {
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

function roundedDistributionSegments<Key extends string>(
  segments: readonly { key: Key; amount: number }[],
) {
  const positiveSegments = segments.filter((segment) => segment.amount > 0);
  const positiveAmountTotal = positiveSegments.reduce(
    (sum, segment) => sum + segment.amount,
    0,
  );
  if (positiveAmountTotal <= 0) return [];

  const rounded = positiveSegments.map((segment, index) => {
    const share = segment.amount / positiveAmountTotal;
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

  return rounded.map(({ key, amount, share, percentage }) => ({
    key,
    amount,
    share,
    percentage,
    isLessThanOnePercent: percentage === 0,
  }));
}

export function calculateMoneyAssetOverview(input: {
  accounts: number | null;
  savings: number | null;
  investments: {
    amount: number | null;
    valuationIncluded: number;
    valuationTotal: number;
  } | null;
}): MoneyAssetOverview {
  if (
    input.accounts == null ||
    input.savings == null ||
    input.investments == null
  ) {
    return { status: MoneyAssetOverviewStatus.UNAVAILABLE };
  }

  const { valuationIncluded, valuationTotal } = input.investments;
  if (valuationTotal > 0 && input.investments.amount == null) {
    return { status: MoneyAssetOverviewStatus.UNAVAILABLE };
  }

  const allocation = roundedDistributionSegments([
    {
      key: MoneyAssetAllocationKey.ACCOUNTS,
      amount: Math.max(input.accounts, 0),
    },
    {
      key: MoneyAssetAllocationKey.SAVINGS,
      amount: Math.max(input.savings, 0),
    },
    {
      key: MoneyAssetAllocationKey.INVESTMENTS,
      amount: Math.max(input.investments.amount ?? 0, 0),
    },
  ]);

  const total = allocation.reduce((sum, segment) => sum + segment.amount, 0);
  const status =
    valuationTotal > valuationIncluded
      ? MoneyAssetOverviewStatus.PARTIAL
      : MoneyAssetOverviewStatus.COMPLETE;

  return {
    status,
    total,
    allocation,
    investmentCoverage: {
      included: valuationIncluded,
      total: valuationTotal,
    },
  };
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
  const creditCards = createMoneyHubCreditCards(input.creditCards, input.today);

  return {
    currency: input.position.currency,
    totalOwnedBalance,
    activeAccountCount: accounts.length,
    accountGroups,
    initialAccountGroups: groupsForInitialRows(accountGroups),
    accountPresentation: accountGroups.length > 1 ? "grouped" : "flat",
    hasMoreAccounts: accounts.length > MONEY_HUB_INITIAL_ACCOUNT_ROW_LIMIT,
    creditCards,
    totalCreditOutstanding: creditCards.reduce(
      (sum, card) => sum + card.outstanding,
      0,
    ),
  };
}

export function createMoneyHubCreditCards(
  cards: CreditCardSummary[],
  today = new Date(),
): MoneyHubCreditCard[] {
  return cards.map((card) => ({
    ...card,
    utilizationForDisplay: card.creditLimit > 0 ? card.utilizationPct : null,
    progressValue:
      card.creditLimit > 0 ? Math.min(card.utilizationPct, 100) : null,
    attention: creditCardAttentionFor(card, today),
  }));
}

/** Per-domain maintenance signal for a Money module row (canonical attention semantics). */
export const MoneyModuleAttentionLevel = {
  /** Review required / due soon — warning treatment, not an error. */
  WARNING: "warning",
  /** Overdue / action required — strongest attention level. */
  CRITICAL: "critical",
} as const;

export type MoneyModuleAttentionLevel =
  (typeof MoneyModuleAttentionLevel)[keyof typeof MoneyModuleAttentionLevel];

export type MoneyHubDomainSummary = {
  /** null ⇒ the domain read failed; never render a fake zero. */
  loaded: boolean;
  count: number;
  /** Current-state magnitude (principal / remaining amount). Neutral styling. */
  total: number | null;
  /** Opposite-direction magnitude (money lent out) shown as a quiet meta signal. */
  secondaryTotal: number | null;
  currency: string | null;
  attention: { level: MoneyModuleAttentionLevel; count: number } | null;
  valuationQuality: InvestmentHomeSummary["valuationQuality"] | null;
  valuationCoverage: { included: number; total: number } | null;
};

export type MoneyHubModuleSummaries = {
  savings: MoneyHubDomainSummary;
  investments: MoneyHubDomainSummary;
  loans: MoneyHubDomainSummary;
  debts: MoneyHubDomainSummary;
};

export type MoneyHubLoanSummaryInput = LoanSummaryRow;

export type MoneyHubModuleSummariesInput = {
  savings: {
    totalPrincipal: number;
    activeCount: number;
    attentionCount: number;
    currency: string | null;
  } | null;
  investments: MoneyHubInvestmentSummary | null;
  loans: readonly MoneyHubLoanSummaryInput[] | null;
  debts: {
    borrowedRemaining: number;
    lentRemaining: number;
    activeCount: number;
    overdueCount: number;
    dueSoonCount: number;
    currency: string | null;
  } | null;
  today?: Date;
};

function loansSummary(
  loans: readonly MoneyHubLoanSummaryInput[],
  todayIso: string,
): MoneyHubDomainSummary {
  const active = loans.filter((loan) => loan.status === LoanStatus.ACTIVE);
  let overdueCount = 0;
  let dueSoonCount = 0;
  for (const loan of active) {
    if (!loan.nextPaymentDate) continue;
    const dueState = getLoanDueState(loan.nextPaymentDate, todayIso);
    if (dueState === LoanDueState.OVERDUE) {
      overdueCount += 1;
    } else if (
      dueState === LoanDueState.DUE_SOON ||
      dueState === LoanDueState.DUE_TODAY
    ) {
      dueSoonCount += 1;
    }
  }
  // Loan records share the household currency; totals never mix currencies.
  const currency = active[0]?.currency ?? null;
  const sameCurrencyActive = active.filter(
    (loan) => currency == null || loan.currency === currency,
  );

  return {
    loaded: true,
    count: active.length,
    total: sameCurrencyActive.reduce(
      (sum, loan) => sum + loan.remainingPrincipal,
      0,
    ),
    secondaryTotal: null,
    currency,
    attention:
      overdueCount > 0
        ? { level: MoneyModuleAttentionLevel.CRITICAL, count: overdueCount }
        : dueSoonCount > 0
          ? { level: MoneyModuleAttentionLevel.WARNING, count: dueSoonCount }
          : null,
    valuationQuality: null,
    valuationCoverage: null,
  };
}

/**
 * Hub-level module summaries for the non-account money domains. Pure: each
 * domain's totals/attention are derived here from already-loaded data so the
 * Money page never re-implements financial rules in JSX. A failed domain read
 * (null input) renders as "unavailable", never as a zero balance.
 */
export function createMoneyHubModuleSummaries(
  input: MoneyHubModuleSummariesInput,
): MoneyHubModuleSummaries {
  const todayIso = todayIsoDate(input.today ?? new Date());
  const unavailable: MoneyHubDomainSummary = {
    loaded: false,
    count: 0,
    total: null,
    secondaryTotal: null,
    currency: null,
    attention: null,
    valuationQuality: null,
    valuationCoverage: null,
  };
  const savings: MoneyHubDomainSummary = input.savings
    ? {
        loaded: true,
        count: input.savings.activeCount,
        total: input.savings.totalPrincipal,
        secondaryTotal: null,
        currency: input.savings.currency,
        attention:
          input.savings.attentionCount > 0
            ? {
                level: MoneyModuleAttentionLevel.WARNING,
                count: input.savings.attentionCount,
              }
            : null,
        valuationQuality: null,
        valuationCoverage: null,
      }
    : unavailable;

  const investments: MoneyHubDomainSummary = input.investments
    ? {
        loaded: true,
        count: input.investments.activeCount,
        total: input.investments.marketValue,
        secondaryTotal: null,
        currency: INVESTMENT_REPORTING_CURRENCY,
        attention: null,
        valuationQuality: input.investments.valuationQuality,
        valuationCoverage: {
          included: input.investments.valuationIncluded,
          total: input.investments.valuationTotal,
        },
      }
    : unavailable;

  const loans = input.loans ? loansSummary(input.loans, todayIso) : unavailable;

  const debts: MoneyHubDomainSummary = input.debts
    ? {
        loaded: true,
        count: input.debts.activeCount,
        total: input.debts.borrowedRemaining,
        secondaryTotal: input.debts.lentRemaining,
        currency: input.debts.currency,
        attention:
          input.debts.overdueCount > 0
            ? {
                level: MoneyModuleAttentionLevel.CRITICAL,
                count: input.debts.overdueCount,
              }
            : input.debts.dueSoonCount > 0
              ? {
                  level: MoneyModuleAttentionLevel.WARNING,
                  count: input.debts.dueSoonCount,
                }
              : null,
        valuationQuality: null,
        valuationCoverage: null,
      }
    : unavailable;

  return { savings, investments, loans, debts };
}
