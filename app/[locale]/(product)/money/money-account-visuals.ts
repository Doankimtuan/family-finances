import type { IconContainerTone } from "@/shared/ui/icon-container";
import { FINANCE_ICONS, type FinanceIconKey } from "@/shared/ui/icon-registry";
import {
  AccountType,
  type AccountType as AccountTypeValue,
} from "@/modules/ledger/application";

export type MoneyAccountVisual = {
  icon: (typeof FINANCE_ICONS)[FinanceIconKey];
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
): MoneyAccountVisual {
  return MONEY_ACCOUNT_VISUALS[accountType];
}
