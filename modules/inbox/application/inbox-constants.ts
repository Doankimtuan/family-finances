/**
 * Inbox domain constants — review queue status, kind, and Spec ReviewItemType.
 */

/** Spec v2.1 ReviewItemType discriminator strings (EVO-02 / AC-INB-01). */
export const ReviewItemType = {
  UNMAPPED_EXPENSE: "UnmappedExpense",
  MATURITY_DECISION: "MaturityDecision",
  SAVINGS_MATURITY_DECISION: "SavingsMaturityDecision",
  EARLY_WITHDRAWAL_CONFIRMATION: "EarlyWithdrawalConfirmation",
  PAYMENT_REMINDER: "PaymentReminder",
  INSTALLMENT_COMPLETE: "InstallmentComplete",
  EMERGENCY_DECLARATION: "EmergencyDeclaration",
} as const;

export type ReviewItemType =
  (typeof ReviewItemType)[keyof typeof ReviewItemType];

export const REVIEW_ITEM_TYPE_VALUES = [
  ReviewItemType.UNMAPPED_EXPENSE,
  ReviewItemType.MATURITY_DECISION,
  ReviewItemType.SAVINGS_MATURITY_DECISION,
  ReviewItemType.EARLY_WITHDRAWAL_CONFIRMATION,
  ReviewItemType.PAYMENT_REMINDER,
  ReviewItemType.INSTALLMENT_COMPLETE,
  ReviewItemType.EMERGENCY_DECLARATION,
] as const;

export const InboxItemStatus = {
  PENDING: "pending",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
  ACKNOWLEDGED: "acknowledged",
  AUTO_RESOLVED: "auto_resolved",
  EXPIRED: "expired",
  ARCHIVED: "archived",
} as const;

export type InboxItemStatus =
  (typeof InboxItemStatus)[keyof typeof InboxItemStatus];

export const INBOX_ITEM_STATUS_VALUES = [
  InboxItemStatus.PENDING,
  InboxItemStatus.RESOLVED,
  InboxItemStatus.DISMISSED,
  InboxItemStatus.ACKNOWLEDGED,
  InboxItemStatus.AUTO_RESOLVED,
  InboxItemStatus.EXPIRED,
  InboxItemStatus.ARCHIVED,
] as const;

/** Statuses shown on the Inbox Archived tab (BR-15). */
export const INBOX_ARCHIVED_STATUS_VALUES = [
  InboxItemStatus.EXPIRED,
  InboxItemStatus.AUTO_RESOLVED,
  InboxItemStatus.ARCHIVED,
  InboxItemStatus.RESOLVED,
  InboxItemStatus.DISMISSED,
  InboxItemStatus.ACKNOWLEDGED,
] as const;

export const InboxItemKind = {
  UNMAPPED_EXPENSE: "unmapped_expense",
  INCOME_SUGGEST: "income_suggest",
  SAVINGS_MATURITY: "savings_maturity",
  SAVINGS_MATURED: "savings_matured",
  RENEWAL_REQUIRED: "renewal_required",
  EARLY_WITHDRAWAL_CONFIRMATION: "early_withdrawal_confirmation",
  PENALTY_WARNING: "penalty_warning",
  RATE_CHANGED_SUGGESTION: "rate_changed_suggestion",
  PACKAGE_EXPIRED: "package_expired",
  EMI_COMPLETE: "emi_complete",
  EMERGENCY_DECLARATION: "emergency_declaration",
  PAYMENT_REMINDER: "payment_reminder",
} as const;

export type InboxItemKind = (typeof InboxItemKind)[keyof typeof InboxItemKind];

export const INBOX_ITEM_KIND_VALUES = [
  InboxItemKind.UNMAPPED_EXPENSE,
  InboxItemKind.INCOME_SUGGEST,
  InboxItemKind.SAVINGS_MATURITY,
  InboxItemKind.SAVINGS_MATURED,
  InboxItemKind.RENEWAL_REQUIRED,
  InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION,
  InboxItemKind.PENALTY_WARNING,
  InboxItemKind.RATE_CHANGED_SUGGESTION,
  InboxItemKind.PACKAGE_EXPIRED,
  InboxItemKind.EMI_COMPLETE,
  InboxItemKind.EMERGENCY_DECLARATION,
  InboxItemKind.PAYMENT_REMINDER,
] as const;

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

/** Extended savings maturity / early-withdraw ack actions (Inbox orchestration). */
export const SavingsMaturityAckAction = {
  RENEW: "renew",
  SWITCH: "switch",
  WITHDRAW: "withdraw",
  CONFIRM_CONFIGURED: "confirm_configured",
  CHOOSE_PACKAGE: "choose_package",
  CHANGE_SETTLEMENT: "change_settlement",
  REMIND_TOMORROW: "remind_tomorrow",
  DISMISS: "dismiss",
} as const;

export type SavingsMaturityAckAction =
  (typeof SavingsMaturityAckAction)[keyof typeof SavingsMaturityAckAction];

export const SAVINGS_MATURITY_ACK_ACTION_VALUES = [
  SavingsMaturityAckAction.RENEW,
  SavingsMaturityAckAction.SWITCH,
  SavingsMaturityAckAction.WITHDRAW,
  SavingsMaturityAckAction.CONFIRM_CONFIGURED,
  SavingsMaturityAckAction.CHOOSE_PACKAGE,
  SavingsMaturityAckAction.CHANGE_SETTLEMENT,
  SavingsMaturityAckAction.REMIND_TOMORROW,
  SavingsMaturityAckAction.DISMISS,
] as const;

export const EarlyWithdrawalAckAction = {
  CONFIRM: "confirm",
  CANCEL: "cancel",
  DISMISS: "dismiss",
} as const;

export type EarlyWithdrawalAckAction =
  (typeof EarlyWithdrawalAckAction)[keyof typeof EarlyWithdrawalAckAction];

export const EARLY_WITHDRAWAL_ACK_ACTION_VALUES = [
  EarlyWithdrawalAckAction.CONFIRM,
  EarlyWithdrawalAckAction.CANCEL,
  EarlyWithdrawalAckAction.DISMISS,
] as const;

export const EmiAckAction = {
  CELEBRATE: "celebrate",
  LATER: "later",
} as const;

export type EmiAckAction = (typeof EmiAckAction)[keyof typeof EmiAckAction];

export type InboxAckAction =
  | MaturityAckAction
  | SavingsMaturityAckAction
  | EarlyWithdrawalAckAction
  | EmiAckAction;

/** BR-16 — silent auto-resolve when confidence meets this floor. */
export const AUTO_RESOLVE_CONFIDENCE_THRESHOLD = 0.9;

/** BR-16 — merchant rule confirmation count before high confidence. */
export const MERCHANT_CONFIRMATION_THRESHOLD = 3;

/** BR-15 — payment reminders expire this many days after due. */
export const PAYMENT_REMINDER_EXPIRE_DAYS = 7;

export function isJarResolvableKind(kind: InboxItemKind): boolean {
  return (
    kind === InboxItemKind.UNMAPPED_EXPENSE ||
    kind === InboxItemKind.INCOME_SUGGEST
  );
}

export function isGuidedKind(kind: InboxItemKind): boolean {
  return (
    kind === InboxItemKind.SAVINGS_MATURITY ||
    kind === InboxItemKind.SAVINGS_MATURED ||
    kind === InboxItemKind.RENEWAL_REQUIRED ||
    kind === InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION ||
    kind === InboxItemKind.PENALTY_WARNING ||
    kind === InboxItemKind.RATE_CHANGED_SUGGESTION ||
    kind === InboxItemKind.PACKAGE_EXPIRED ||
    kind === InboxItemKind.EMI_COMPLETE ||
    kind === InboxItemKind.EMERGENCY_DECLARATION ||
    kind === InboxItemKind.PAYMENT_REMINDER
  );
}

export function isArchivedStatus(status: InboxItemStatus): boolean {
  return (INBOX_ARCHIVED_STATUS_VALUES as readonly string[]).includes(status);
}

export function mapInboxKind(value: string | null | undefined): InboxItemKind {
  switch (value) {
    case InboxItemKind.INCOME_SUGGEST:
      return InboxItemKind.INCOME_SUGGEST;
    case InboxItemKind.SAVINGS_MATURITY:
      return InboxItemKind.SAVINGS_MATURITY;
    case InboxItemKind.SAVINGS_MATURED:
      return InboxItemKind.SAVINGS_MATURED;
    case InboxItemKind.RENEWAL_REQUIRED:
      return InboxItemKind.RENEWAL_REQUIRED;
    case InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION:
      return InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION;
    case InboxItemKind.PENALTY_WARNING:
      return InboxItemKind.PENALTY_WARNING;
    case InboxItemKind.RATE_CHANGED_SUGGESTION:
      return InboxItemKind.RATE_CHANGED_SUGGESTION;
    case InboxItemKind.PACKAGE_EXPIRED:
      return InboxItemKind.PACKAGE_EXPIRED;
    case InboxItemKind.EMI_COMPLETE:
      return InboxItemKind.EMI_COMPLETE;
    case InboxItemKind.EMERGENCY_DECLARATION:
      return InboxItemKind.EMERGENCY_DECLARATION;
    case InboxItemKind.PAYMENT_REMINDER:
      return InboxItemKind.PAYMENT_REMINDER;
    default:
      return InboxItemKind.UNMAPPED_EXPENSE;
  }
}

export function mapInboxStatus(
  value: string | null | undefined,
): InboxItemStatus {
  switch (value) {
    case InboxItemStatus.RESOLVED:
      return InboxItemStatus.RESOLVED;
    case InboxItemStatus.DISMISSED:
      return InboxItemStatus.DISMISSED;
    case InboxItemStatus.ACKNOWLEDGED:
      return InboxItemStatus.ACKNOWLEDGED;
    case InboxItemStatus.AUTO_RESOLVED:
      return InboxItemStatus.AUTO_RESOLVED;
    case InboxItemStatus.EXPIRED:
      return InboxItemStatus.EXPIRED;
    case InboxItemStatus.ARCHIVED:
      return InboxItemStatus.ARCHIVED;
    default:
      return InboxItemStatus.PENDING;
  }
}

/**
 * Map storage kind → Spec ReviewItemType (AC-INB-01).
 * `income_suggest` is rewrite-only and has no Spec type.
 */
export function toReviewItemType(kind: InboxItemKind): ReviewItemType | null {
  switch (kind) {
    case InboxItemKind.UNMAPPED_EXPENSE:
      return ReviewItemType.UNMAPPED_EXPENSE;
    case InboxItemKind.SAVINGS_MATURITY:
    case InboxItemKind.SAVINGS_MATURED:
    case InboxItemKind.RENEWAL_REQUIRED:
      return ReviewItemType.SAVINGS_MATURITY_DECISION;
    case InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION:
      return ReviewItemType.EARLY_WITHDRAWAL_CONFIRMATION;
    case InboxItemKind.PAYMENT_REMINDER:
      return ReviewItemType.PAYMENT_REMINDER;
    case InboxItemKind.EMI_COMPLETE:
      return ReviewItemType.INSTALLMENT_COMPLETE;
    case InboxItemKind.EMERGENCY_DECLARATION:
      return ReviewItemType.EMERGENCY_DECLARATION;
    default:
      return null;
  }
}

export function reviewItemTypeToKind(type: ReviewItemType): InboxItemKind {
  switch (type) {
    case ReviewItemType.MATURITY_DECISION:
    case ReviewItemType.SAVINGS_MATURITY_DECISION:
      return InboxItemKind.SAVINGS_MATURED;
    case ReviewItemType.EARLY_WITHDRAWAL_CONFIRMATION:
      return InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION;
    case ReviewItemType.PAYMENT_REMINDER:
      return InboxItemKind.PAYMENT_REMINDER;
    case ReviewItemType.INSTALLMENT_COMPLETE:
      return InboxItemKind.EMI_COMPLETE;
    case ReviewItemType.EMERGENCY_DECLARATION:
      return InboxItemKind.EMERGENCY_DECLARATION;
    default:
      return InboxItemKind.UNMAPPED_EXPENSE;
  }
}
