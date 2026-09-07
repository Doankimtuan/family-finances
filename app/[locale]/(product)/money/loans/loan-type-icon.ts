import type { IconSvgElement } from "@hugeicons/react";
import {
  BankIcon,
  BanknoteXIcon,
  Car01Icon,
  CreditCardIcon,
  GraduationCapIcon,
  HealthIcon,
  Home01Icon,
  ShoppingBag01Icon,
  UserGroupIcon,
  Wallet02Icon,
} from "@hugeicons/core-free-icons";
import { LoanType } from "@/modules/ledger/application/loan-constants";

const LOAN_TYPE_ICONS = {
  [LoanType.BANK_LOAN]: BankIcon,
  [LoanType.PERSONAL_LOAN]: Wallet02Icon,
  [LoanType.FAMILY_LOAN]: UserGroupIcon,
  [LoanType.FRIEND_LOAN]: UserGroupIcon,
  [LoanType.STORE_FINANCING]: ShoppingBag01Icon,
  [LoanType.BNPL]: CreditCardIcon,
  [LoanType.TUITION]: GraduationCapIcon,
  [LoanType.MEDICAL]: HealthIcon,
  [LoanType.VEHICLE]: Car01Icon,
  [LoanType.HOME]: Home01Icon,
  [LoanType.OTHER]: BanknoteXIcon,
} as const satisfies Record<LoanType, IconSvgElement>;

/** Semantic loan-type glyph used on scan and detail surfaces. */
export function loanTypeIcon(loanType: LoanType): IconSvgElement {
  return LOAN_TYPE_ICONS[loanType];
}
