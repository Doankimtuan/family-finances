import { INBOX_TEST_ID } from "@/modules/inbox/application/inbox-constants";
import {
  FinancialNumberKind,
  type FinancialNumberKind as FinancialNumberKindValue,
} from "@/shared/patterns/financial-number-kind";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { cn } from "@/shared/utils/cn";

type InboxFinancialAmountProps = {
  amountLabel: string;
  kind: FinancialNumberKindValue;
  className?: string;
};

/**
 * Inbox money as existing financial-number kind. Missing labels stay omitted
 * at the caller — this never formats a fallback zero.
 */
export function InboxFinancialAmount({
  amountLabel,
  kind,
  className,
}: InboxFinancialAmountProps) {
  return (
    <span
      data-financial-kind={kind}
      className={cn(
        "tabular-nums tracking-tight",
        kind === FinancialNumberKind.ESTIMATE ? "font-medium" : "font-semibold",
        className,
      )}
    >
      <FinancialValue dataTestId={INBOX_TEST_ID.AMOUNT}>
        {amountLabel}
      </FinancialValue>
    </span>
  );
}
