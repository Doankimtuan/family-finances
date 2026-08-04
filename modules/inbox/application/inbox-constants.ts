/**
 * Inbox domain constants — review queue status and kind.
 */

export const InboxItemStatus = {
  PENDING: "pending",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
  ACKNOWLEDGED: "acknowledged",
} as const;

export type InboxItemStatus =
  (typeof InboxItemStatus)[keyof typeof InboxItemStatus];

export const InboxItemKind = {
  UNMAPPED_EXPENSE: "unmapped_expense",
  INCOME_SUGGEST: "income_suggest",
  SAVINGS_MATURITY: "savings_maturity",
  EMI_COMPLETE: "emi_complete",
  EMERGENCY_DECLARATION: "emergency_declaration",
} as const;

export type InboxItemKind = (typeof InboxItemKind)[keyof typeof InboxItemKind];

export const InboxSourceType = {
  TRANSACTION: "transaction",
  GUIDED: "guided",
  PLAN_MOVEMENT: "plan_movement",
} as const;

export type InboxSourceType =
  (typeof InboxSourceType)[keyof typeof InboxSourceType];

export const INBOX_SOURCE_TYPE_VALUES = [
  InboxSourceType.TRANSACTION,
  InboxSourceType.GUIDED,
  InboxSourceType.PLAN_MOVEMENT,
] as const;

export const MaturityAckAction = {
  RENEW: "renew",
  SWITCH: "switch",
  WITHDRAW: "withdraw",
} as const;

export type MaturityAckAction =
  (typeof MaturityAckAction)[keyof typeof MaturityAckAction];

export const EmiAckAction = {
  CELEBRATE: "celebrate",
  LATER: "later",
} as const;

export type EmiAckAction = (typeof EmiAckAction)[keyof typeof EmiAckAction];

export type InboxAckAction = MaturityAckAction | EmiAckAction;

export function isJarResolvableKind(kind: InboxItemKind): boolean {
  return (
    kind === InboxItemKind.UNMAPPED_EXPENSE ||
    kind === InboxItemKind.INCOME_SUGGEST
  );
}

export function isGuidedKind(kind: InboxItemKind): boolean {
  return (
    kind === InboxItemKind.SAVINGS_MATURITY ||
    kind === InboxItemKind.EMI_COMPLETE ||
    kind === InboxItemKind.EMERGENCY_DECLARATION
  );
}

export function mapInboxKind(value: string | null | undefined): InboxItemKind {
  switch (value) {
    case InboxItemKind.INCOME_SUGGEST:
      return InboxItemKind.INCOME_SUGGEST;
    case InboxItemKind.SAVINGS_MATURITY:
      return InboxItemKind.SAVINGS_MATURITY;
    case InboxItemKind.EMI_COMPLETE:
      return InboxItemKind.EMI_COMPLETE;
    case InboxItemKind.EMERGENCY_DECLARATION:
      return InboxItemKind.EMERGENCY_DECLARATION;
    default:
      return InboxItemKind.UNMAPPED_EXPENSE;
  }
}
