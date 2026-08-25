import {
  isMaturityAttention,
  SavingsMaturityState,
} from "@/modules/savings/application";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";

/**
 * Lifecycle badge for a savings item — calm for active/history states,
 * escalating attention only for review-required maturity states. Text always
 * accompanies the tone; the label comes from the caller's translations.
 */
export function SavingsMaturityBadge({
  state,
  label,
  testId,
}: {
  state: SavingsMaturityState;
  label: string;
  testId?: string;
}) {
  const tone = isMaturityAttention(state)
    ? StatusBadgeTone.WARNING
    : state === SavingsMaturityState.MATURING_SOON
      ? StatusBadgeTone.INFO
      : StatusBadgeTone.NEUTRAL;
  return (
    <StatusBadge tone={tone} data-testid={testId}>
      {label}
    </StatusBadge>
  );
}
