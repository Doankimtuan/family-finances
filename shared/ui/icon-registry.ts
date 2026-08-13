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
} as const;

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
  return CATEGORY_ICONS[key as CategoryIconKey] ?? CATEGORY_ICONS.shopping;
}
