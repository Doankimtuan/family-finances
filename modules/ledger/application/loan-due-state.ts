import {
  LOAN_DUE_SOON_DAYS,
  LoanDueState,
  type LoanDueState as LoanDueStateValue,
} from "./loan-constants";
import { differenceInUtcCalendarDays } from "@/shared/utils/iso-date";

export function getLoanDueState(
  nextPaymentDate: string | null,
  today: string,
): LoanDueStateValue {
  if (!nextPaymentDate) return LoanDueState.NONE;
  const daysUntilDue = differenceInUtcCalendarDays(today, nextPaymentDate);
  if (daysUntilDue < 0) return LoanDueState.OVERDUE;
  if (daysUntilDue === 0) return LoanDueState.DUE_TODAY;
  if (daysUntilDue <= LOAN_DUE_SOON_DAYS) return LoanDueState.DUE_SOON;
  return LoanDueState.UPCOMING;
}
