import type { IconSvgElement } from "@hugeicons/react";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import type { IconContainerTone } from "@/shared/ui/icon-container";

export const MoneyRelatedFinanceKey = {
  DEBTS: "debts",
  SAVINGS: "savings",
  INVESTMENTS: "investments",
  LOANS: "loans",
} as const;

export type MoneyRelatedFinanceKey =
  (typeof MoneyRelatedFinanceKey)[keyof typeof MoneyRelatedFinanceKey];

export type MoneyRelatedFinanceItem = {
  key: MoneyRelatedFinanceKey;
  href: string;
  testId: string;
  icon: IconSvgElement;
  iconTone: IconContainerTone;
};

export const MONEY_RELATED_FINANCE_ITEMS: readonly MoneyRelatedFinanceItem[] = [
  {
    key: MoneyRelatedFinanceKey.DEBTS,
    href: APP_PATH.MONEY_DEBTS,
    testId: "money-link-debts",
    icon: FINANCE_ICONS.debt,
    iconTone: "debt",
  },
  {
    key: MoneyRelatedFinanceKey.SAVINGS,
    href: APP_PATH.MONEY_SAVINGS,
    testId: "money-link-savings",
    icon: FINANCE_ICONS.savings,
    iconTone: "savings",
  },
  {
    key: MoneyRelatedFinanceKey.INVESTMENTS,
    href: APP_PATH.MONEY_INVESTMENTS,
    testId: "money-link-investments",
    icon: FINANCE_ICONS.investment,
    iconTone: "investment",
  },
  {
    key: MoneyRelatedFinanceKey.LOANS,
    href: APP_PATH.MONEY_LOANS,
    testId: "money-link-loans",
    icon: FINANCE_ICONS.loan,
    iconTone: "info",
  },
] as const;
