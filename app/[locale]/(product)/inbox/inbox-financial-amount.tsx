import {
  FinancialAmount,
  FinancialAmountSize,
  FinancialAmountTone,
  type FinancialAmountTone as FinancialAmountToneValue,
} from "@/shared/ui/financial-amount";
import {
  FinancialNumberKind,
  type FinancialNumberKind as FinancialNumberKindValue,
} from "@/shared/patterns/financial-number-kind";
import { INBOX_TEST_ID } from "@/modules/inbox/application/inbox-constants";
import { cn } from "@/shared/utils/cn";

type InboxFinancialAmountProps = {
  amountLabel: string;
  kind: FinancialNumberKindValue;
  tone?: FinancialAmountToneValue;
  className?: string;
};

/** Inbox source amounts use shared formatting and privacy behavior. */
export function InboxFinancialAmount({
  amountLabel,
  kind,
  tone = FinancialAmountTone.NEUTRAL,
  className,
}: InboxFinancialAmountProps) {
  return (
    <FinancialAmount
      amountLabel={amountLabel}
      size={FinancialAmountSize.ROW_AMOUNT}
      kind={kind}
      tone={tone}
      privacyAware
      data-testid={INBOX_TEST_ID.AMOUNT}
      className={cn(
        kind === FinancialNumberKind.ESTIMATE ? "font-medium" : "font-semibold",
        className,
      )}
    />
  );
}
