import {
  Add01Icon,
  ArrowDataTransferHorizontalIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowTurnBackwardIcon,
  BankIcon,
  BanknoteIcon,
  BanknoteXIcon,
  Calendar03Icon,
  Car01Icon,
  ChartBarLineIcon,
  Coffee01Icon,
  CreditCardIcon,
  Delete02Icon,
  Edit02Icon,
  FilterIcon,
  GraduationCapIcon,
  HealthIcon,
  Home01Icon,
  InboxIcon,
  MoneyReceive01Icon,
  MoneySend01Icon,
  MoreHorizontalIcon,
  Notification03Icon,
  PiggyBankIcon,
  Restaurant01Icon,
  Search01Icon,
  ShoppingBag01Icon,
  TravelBagIcon,
  UserGroupIcon,
  Wallet02Icon,
} from "@hugeicons/core-free-icons";
import type { IconContainerTone } from "./icon-container";

/** Stable icons for the five-tab household shell. */
export const NAVIGATION_ICONS = {
  home: Home01Icon,
  money: Wallet02Icon,
  plan: Calendar03Icon,
  inbox: InboxIcon,
  together: UserGroupIcon,
} as const;

/** Finance concepts are semantic roles, not presentation-specific icon names. */
export const FINANCE_ICONS = {
  account: BankIcon,
  wallet: Wallet02Icon,
  cash: BanknoteIcon,
  bank: BankIcon,
  card: CreditCardIcon,
  income: MoneyReceive01Icon,
  expense: MoneySend01Icon,
  transfer: ArrowDataTransferHorizontalIcon,
  investment: ChartBarLineIcon,
  savings: PiggyBankIcon,
  debt: BanknoteXIcon,
  loan: BankIcon,
  refund: ArrowTurnBackwardIcon,
} as const;

/** Stable category keys are safe to persist; UI maps them to Hugeicons here. */
export const CATEGORY_ICONS = {
  coffee: Coffee01Icon,
  food: Restaurant01Icon,
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
  FOOD: "food",
  TRANSPORT: "transport",
  HOME: "home",
  SHOPPING: "shopping",
  HEALTH: "health",
  EDUCATION: "education",
  OTHER: "other",
} as const;
export type CategoryVisualKey =
  (typeof CategoryVisualKey)[keyof typeof CategoryVisualKey];

export type CategoryVisual = {
  iconKey: CategoryVisualKey;
  icon: (typeof CATEGORY_ICONS)[keyof typeof CATEGORY_ICONS];
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

/**
 * Category records currently expose an immutable ID and display name, not a stored
 * icon field. This resolver produces a stable presentation key once in the view model,
 * rather than coupling Home JSX to raw names or icon components.
 */
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
}): CategoryVisual {
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
  filter: FilterIcon,
  edit: Edit02Icon,
  delete: Delete02Icon,
  add: Add01Icon,
  more: MoreHorizontalIcon,
  back: ArrowLeft01Icon,
  forward: ArrowRight01Icon,
} as const;
export const UTILITY_ICONS = {
  calendar: Calendar03Icon,
  notification: Notification03Icon,
} as const;

export type FinanceIconKey = keyof typeof FINANCE_ICONS;
export type CategoryIconKey = keyof typeof CATEGORY_ICONS;

export function financeIconFor(key: string) {
  return FINANCE_ICONS[key as FinanceIconKey] ?? FINANCE_ICONS.expense;
}

export function categoryIconFor(key: string) {
  return CATEGORY_ICONS[key as CategoryIconKey] ?? CATEGORY_ICONS.other;
}
