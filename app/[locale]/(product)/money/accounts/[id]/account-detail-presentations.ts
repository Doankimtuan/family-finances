import {
  TRANSACTION_LEDGER_CREDIT_TYPES,
  type TransactionLedgerType as TransactionLedgerTypeValue,
} from "@/modules/ledger/application";
import { IconContainerTone } from "@/shared/ui/icon-container";
import { categoryVisualFor, FINANCE_ICONS } from "@/shared/ui/icon-registry";

export type AccountIdentityPresentation = {
  name: string;
  typeLabel: string | null;
};

const LEDGER_CREDIT_TYPE_SET = new Set<string>(TRANSACTION_LEDGER_CREDIT_TYPES);

/** Avoid repeating a localized type when it already matches the account name. */
export function resolveAccountIdentity(
  name: string,
  typeLabel: string,
): AccountIdentityPresentation {
  return {
    name,
    typeLabel: name === typeLabel ? null : typeLabel,
  };
}

export function isAccountActivityCredit(type: TransactionLedgerTypeValue) {
  return LEDGER_CREDIT_TYPE_SET.has(type);
}

export function resolveAccountActivityLeading(transaction: {
  type: TransactionLedgerTypeValue;
  categoryId: string | null;
  categoryName: string | null;
}) {
  const isCredit = isAccountActivityCredit(transaction.type);
  if (transaction.categoryName) {
    const visual = categoryVisualFor({
      categoryId: transaction.categoryId,
      categoryName: transaction.categoryName,
    });
    return { isCredit, icon: visual.icon, iconTone: visual.tone };
  }
  if (isCredit) {
    return {
      isCredit,
      icon: FINANCE_ICONS.income,
      iconTone: IconContainerTone.INCOME,
    };
  }
  return {
    isCredit,
    icon: FINANCE_ICONS.expense,
    iconTone: IconContainerTone.EXPENSE,
  };
}
