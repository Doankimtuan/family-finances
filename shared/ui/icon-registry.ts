import {
  Add01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  BankIcon,
  Building02Icon,
  Coins01Icon,
  Calendar03Icon,
  Car01Icon,
  ChartBarLineIcon,
  CheckmarkCircle02Icon,
  Coffee01Icon,
  Delete02Icon,
  Edit02Icon,
  EyeIcon,
  EyeOffIcon,
  FilterIcon,
  GraduationCapIcon,
  HealthIcon,
  Home01Icon,
  InboxIcon,
  InformationCircleIcon,
  MoneyReceive01Icon,
  MoneySafeIcon,
  MoreHorizontalIcon,
  Notification03Icon,
  PiggyBankIcon,
  SafeBoxIcon,
  Search01Icon,
  Settings01Icon,
  Shield01Icon,
  SmartPhone01Icon,
  ShoppingBag01Icon,
  Tick01Icon,
  TravelBagIcon,
  UserIcon,
  UserGroupIcon,
  Wallet02Icon,
} from "@/shared/ui/stitch-icon-compat";
import type { IconContainerTone } from "./icon-container";
import type { IconSvgElement } from "@hugeicons/react";
import {
  IconKey,
  isCategoryIconKey,
  type CategoryIconKey,
} from "@/modules/ledger/application/icon-constants";
import { CATEGORY_ICON_BY_KEY } from "./stitch-icon-choices";
import {
  StitchAccountIcon,
  StitchCreditCardIcon,
  StitchCashIcon,
  StitchDebtIcon,
  StitchExpenseIcon,
  StitchFoodIcon,
  StitchGoalIcon,
  StitchIncomeIcon,
  StitchHomeInvestmentIcon,
  StitchHomeSummaryLoanIcon,
  StitchHomePersonalDebtIcon,
  StitchHomeSavingsIcon,
  StitchInvestmentIcon,
  StitchJarIcon,
  StitchLockIcon,
  StitchLoanIcon,
  StitchLedgerIcon,
  StitchMoneyIcon,
  StitchNavigationHomeIcon,
  StitchNavigationPlanIcon,
  StitchPlanIcon,
  StitchRecurringPaymentIcon,
  StitchHistoryIcon,
  StitchInboxIcon,
  StitchSortIcon,
  StitchCloseIcon,
  StitchRefundIcon,
  StitchSavingsIcon,
  StitchTransferIcon,
  StitchWalletIcon,
  StitchStockIcon,
  StitchFundIcon,
  StitchGoldIcon,
  StitchCryptoIcon,
  StitchProviderShieldIcon,
} from "./stitch-icon-artwork";

/** Stable icons for the household destinations and header links. */
export const NAVIGATION_ICONS = {
  home: Home01Icon,
  money: StitchMoneyIcon,
  plan: StitchPlanIcon,
  inbox: InboxIcon,
  together: UserGroupIcon,
} as const;

/** Stitch icons for the five bottom navigation destinations. */
export const BOTTOM_NAVIGATION_ICONS = {
  home: StitchNavigationHomeIcon,
  money: StitchWalletIcon,
  plan: StitchNavigationPlanIcon,
  inbox: StitchInboxIcon,
} as const;

/** Finance concepts are semantic roles, not presentation-specific icon names. */
export const SAVINGS_PROVIDER_ICONS = {
  bank: BankIcon,
  wallet: Wallet02Icon,
  building: Building02Icon,
  piggy_bank: PiggyBankIcon,
  coins: Coins01Icon,
  chart: ChartBarLineIcon,
  smartphone: SmartPhone01Icon,
  shield: Shield01Icon,
  vault: SafeBoxIcon,
  finance: MoneySafeIcon,
} as const;
export type SavingsProviderIconKey = keyof typeof SAVINGS_PROVIDER_ICONS;

export const FINANCE_ICONS = {
  account: StitchAccountIcon,
  wallet: Wallet02Icon,
  cash: StitchCashIcon,
  bank: BankIcon,
  card: StitchCreditCardIcon,
  income: StitchIncomeIcon,
  expense: StitchExpenseIcon,
  transfer: StitchTransferIcon,
  investment: StitchInvestmentIcon,
  savings: StitchSavingsIcon,
  debt: StitchDebtIcon,
  loan: StitchLoanIcon,
  ledger: StitchLedgerIcon,
  refund: StitchRefundIcon,
} as const;

/** Canonical Stitch artwork for investment asset identities and household rules. */
export const INVESTMENT_ICONS = {
  stock: StitchStockIcon,
  fund: StitchFundIcon,
  gold: StitchGoldIcon,
  crypto: StitchCryptoIcon,
  bond: StitchFundIcon,
  rules: StitchProviderShieldIcon,
} as const;

/** Icons selected for the canonical Home product summary rows. */
export const HOME_PRODUCT_SUMMARY_ICONS = {
  savings: StitchHomeSavingsIcon,
  investments: StitchHomeInvestmentIcon,
  loans: StitchHomeSummaryLoanIcon,
  debt: StitchHomePersonalDebtIcon,
} as const;

/** Exact domain artwork used by the canonical Stitch Money Overview rows. */
export const MONEY_OVERVIEW_ICONS = {
  savings: StitchLockIcon,
} as const;

/** Stable Plan-domain icons. Intention envelopes, not bank balances. */
export const PLAN_ICONS = {
  jar: StitchJarIcon,
  goal: StitchGoalIcon,
  recurring: StitchRecurringPaymentIcon,
  calendar: Calendar03Icon,
  monthlyReview: StitchHistoryIcon,
  lockedPeriod: StitchLockIcon,
  ritual: CheckmarkCircle02Icon,
} as const;

/** Stable category keys are safe to persist; UI maps them to Stitch artwork here. */
export const CATEGORY_ICONS = {
  coffee: Coffee01Icon,
  food: StitchFoodIcon,
  shopping: ShoppingBag01Icon,
  travel: TravelBagIcon,
  transport: Car01Icon,
  family: UserGroupIcon,
  salary: MoneyReceive01Icon,
  health: HealthIcon,
  education: GraduationCapIcon,
  home: Home01Icon,
  other: MoreHorizontalIcon,
} as const;

export const CategoryVisualKey = {
  FOOD: IconKey.FOOD,
  TRANSPORT: IconKey.TRANSPORT,
  HOME: IconKey.HOME,
  SHOPPING: IconKey.SHOPPING,
  HEALTH: IconKey.HEALTH,
  EDUCATION: IconKey.EDUCATION,
  OTHER: IconKey.OTHER,
} as const;
export type CategoryVisualKey =
  (typeof CategoryVisualKey)[keyof typeof CategoryVisualKey];

export type CategoryVisual = {
  iconKey: CategoryIconKey;
  icon: IconSvgElement;
  tone: IconContainerTone;
};

const CATEGORY_VISUALS: Record<CategoryVisualKey, CategoryVisual> = {
  [CategoryVisualKey.FOOD]: {
    iconKey: CategoryVisualKey.FOOD,
    icon: CATEGORY_ICONS.food,
    tone: "expense",
  },
  [CategoryVisualKey.TRANSPORT]: {
    iconKey: CategoryVisualKey.TRANSPORT,
    icon: CATEGORY_ICONS.transport,
    tone: "primary",
  },
  [CategoryVisualKey.HOME]: {
    iconKey: CategoryVisualKey.HOME,
    icon: CATEGORY_ICONS.home,
    tone: "primary",
  },
  [CategoryVisualKey.SHOPPING]: {
    iconKey: CategoryVisualKey.SHOPPING,
    icon: CATEGORY_ICONS.shopping,
    tone: "expense",
  },
  [CategoryVisualKey.HEALTH]: {
    iconKey: CategoryVisualKey.HEALTH,
    icon: CATEGORY_ICONS.health,
    tone: "info",
  },
  [CategoryVisualKey.EDUCATION]: {
    iconKey: CategoryVisualKey.EDUCATION,
    icon: CATEGORY_ICONS.education,
    tone: "primary",
  },
  [CategoryVisualKey.OTHER]: {
    iconKey: CategoryVisualKey.OTHER,
    icon: CATEGORY_ICONS.other,
    tone: "neutral",
  },
};

/** Prefer persisted category artwork and infer a safe default for legacy rows. */
const CATEGORY_SEMANTIC_MATCHERS: Array<{
  visualKey: CategoryVisualKey;
  terms: readonly string[];
}> = [
  {
    visualKey: CategoryVisualKey.FOOD,
    terms: ["food", "ăn uống", "restaurant", "cafe", "coffee"],
  },
  {
    visualKey: CategoryVisualKey.TRANSPORT,
    terms: ["transport", "di chuyển", "travel", "car", "bus"],
  },
  {
    visualKey: CategoryVisualKey.HOME,
    terms: ["home", "nhà", "housing", "rent", "utility"],
  },
  {
    visualKey: CategoryVisualKey.SHOPPING,
    terms: ["shopping", "mua sắm", "shop"],
  },
  {
    visualKey: CategoryVisualKey.HEALTH,
    terms: ["health", "sức khỏe", "medical"],
  },
  {
    visualKey: CategoryVisualKey.EDUCATION,
    terms: ["education", "giáo dục", "school", "study"],
  },
];

/** Resolve one calm, token-driven category visual with a safe neutral fallback. */
export function categoryVisualFor(input: {
  categoryId: string | null;
  categoryName: string | null;
  iconKey?: string | null;
}): CategoryVisual {
  if (input.iconKey && isCategoryIconKey(input.iconKey)) {
    return {
      iconKey: input.iconKey,
      icon: CATEGORY_ICON_BY_KEY[input.iconKey],
      tone:
        CATEGORY_VISUALS[input.iconKey as CategoryVisualKey]?.tone ?? "neutral",
    };
  }
  const searchableValue =
    `${input.categoryId ?? ""} ${input.categoryName ?? ""}`.toLocaleLowerCase();
  const match = CATEGORY_SEMANTIC_MATCHERS.find(({ terms }) =>
    terms.some((term) => searchableValue.includes(term)),
  );
  return CATEGORY_VISUALS[match?.visualKey ?? CategoryVisualKey.OTHER];
}

/** Common interaction icons retain semantic names across feature modules. */
export const ACTION_ICONS = {
  search: Search01Icon,
  close: StitchCloseIcon,
  filter: FilterIcon,
  sort: StitchSortIcon,
  edit: Edit02Icon,
  delete: Delete02Icon,
  add: Add01Icon,
  more: MoreHorizontalIcon,
  back: ArrowLeft01Icon,
  forward: ArrowRight01Icon,
  expand: ArrowDown01Icon,
  check: Tick01Icon,
  success: CheckmarkCircle02Icon,
} as const;
export const UTILITY_ICONS = {
  calendar: Calendar03Icon,
  notification: Notification03Icon,
  profile: UserIcon,
  settings: Settings01Icon,
  shield: Shield01Icon,
  financialVisible: EyeIcon,
  financialHidden: EyeOffIcon,
  info: InformationCircleIcon,
} as const;

export const FinanceIconKey = {
  ACCOUNT: "account",
  WALLET: "wallet",
  CASH: "cash",
  BANK: "bank",
  CARD: "card",
  INCOME: "income",
  EXPENSE: "expense",
  TRANSFER: "transfer",
  INVESTMENT: "investment",
  SAVINGS: "savings",
  DEBT: "debt",
  LOAN: "loan",
  LEDGER: "ledger",
  REFUND: "refund",
} as const;

export type FinanceIconKey =
  (typeof FinanceIconKey)[keyof typeof FinanceIconKey];

export function financeIconFor(key: FinanceIconKey) {
  return FINANCE_ICONS[key];
}
