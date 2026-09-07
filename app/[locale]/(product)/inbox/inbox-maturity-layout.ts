import { SavingsMaturityAckAction } from "@/modules/inbox/application/inbox-constants";
import { RenewalSuggestedAction } from "@/modules/savings/application/savings-constants";
import {
  differenceInUtcCalendarDays,
  todayIsoDate,
} from "@/shared/utils/iso-date";

export const INBOX_MATURITY_MONEY_ACTIONS = [
  SavingsMaturityAckAction.CONFIRM_CONFIGURED,
  SavingsMaturityAckAction.SWITCH,
  SavingsMaturityAckAction.WITHDRAW,
] as const;

export type InboxMaturityMoneyAction =
  (typeof INBOX_MATURITY_MONEY_ACTIONS)[number];

export type InboxMaturityPrimaryAction =
  | typeof SavingsMaturityAckAction.CONFIRM_CONFIGURED
  | typeof SavingsMaturityAckAction.WITHDRAW
  | typeof SavingsMaturityAckAction.REMIND_TOMORROW;

export function isInboxMaturityReminder(
  cascadeDay: number | undefined,
  maturityDate: string | undefined,
  today = todayIsoDate(),
): boolean {
  return (
    cascadeDay != null &&
    maturityDate != null &&
    differenceInUtcCalendarDays(today, maturityDate) > 0
  );
}

export const INBOX_MATURITY_ACTION_LABEL = {
  [SavingsMaturityAckAction.CONFIRM_CONFIGURED]: "maturityConfirm",
  [SavingsMaturityAckAction.SWITCH]: "maturitySwitch",
  [SavingsMaturityAckAction.WITHDRAW]: "maturityWithdraw",
  [SavingsMaturityAckAction.REMIND_TOMORROW]: "maturityRemind",
} as const;

const MATURITY_MONEY_MOVING_ACTIONS = new Set<SavingsMaturityAckAction>([
  SavingsMaturityAckAction.WITHDRAW,
  SavingsMaturityAckAction.CONFIRM_CONFIGURED,
  SavingsMaturityAckAction.SWITCH,
  SavingsMaturityAckAction.CHANGE_SETTLEMENT,
]);

export function resolveInboxMaturityPrimaryAction(
  suggestedAction: RenewalSuggestedAction,
  isReminder = false,
): InboxMaturityPrimaryAction {
  if (isReminder) return SavingsMaturityAckAction.REMIND_TOMORROW;
  if (suggestedAction === RenewalSuggestedAction.WITHDRAW) {
    return SavingsMaturityAckAction.WITHDRAW;
  }
  return SavingsMaturityAckAction.CONFIRM_CONFIGURED;
}

export function inboxMaturitySecondaryActions(
  primary: InboxMaturityPrimaryAction,
): InboxMaturityMoneyAction[] {
  if (primary === SavingsMaturityAckAction.REMIND_TOMORROW) return [];
  return INBOX_MATURITY_MONEY_ACTIONS.filter((action) => action !== primary);
}

export function isMaturityMoneyMovingAction(
  action: SavingsMaturityAckAction,
): boolean {
  return MATURITY_MONEY_MOVING_ACTIONS.has(action);
}
