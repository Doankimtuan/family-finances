import type { IconContainerTone } from "@/shared/ui/icon-container";
import type { IconSvgElement } from "@hugeicons/react";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { ACCOUNT_ICON_BY_KEY } from "@/shared/ui/stitch-icon-choices";
import {
  isAccountIconKey,
  type AccountIconKey,
} from "@/modules/ledger/application/icon-constants";
import {
  AccountType,
  type AccountType as AccountTypeValue,
} from "@/modules/ledger/application/account-constants";

export type MoneyAccountVisual = {
  icon: IconSvgElement;
  tone: IconContainerTone;
};

const MONEY_ACCOUNT_VISUALS: Record<AccountTypeValue, MoneyAccountVisual> = {
  [AccountType.CASH]: {
    icon: FINANCE_ICONS.cash,
    tone: "income",
  },
  [AccountType.CHECKING]: {
    icon: FINANCE_ICONS.bank,
    tone: "primary",
  },
  [AccountType.SAVINGS]: {
    icon: FINANCE_ICONS.savings,
    tone: "savings",
  },
  [AccountType.EWALLET]: {
    icon: FINANCE_ICONS.wallet,
    tone: "info",
  },
  [AccountType.BROKERAGE]: {
    icon: FINANCE_ICONS.investment,
    tone: "investment",
  },
  [AccountType.CREDIT_CARD]: {
    icon: FINANCE_ICONS.card,
    tone: "debt",
  },
  [AccountType.SAVINGS_PRODUCT]: {
    icon: FINANCE_ICONS.savings,
    tone: "savings",
  },
  [AccountType.OTHER]: {
    icon: FINANCE_ICONS.account,
    tone: "neutral",
  },
};

export function moneyAccountVisualFor(
  accountType: AccountTypeValue,
  iconKey?: AccountIconKey | string | null,
): MoneyAccountVisual {
  const fallback = MONEY_ACCOUNT_VISUALS[accountType];
  return iconKey && isAccountIconKey(iconKey)
    ? { ...fallback, icon: ACCOUNT_ICON_BY_KEY[iconKey] }
    : fallback;
}
