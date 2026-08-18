/**
 * Inbox domain constants — canonical review-queue taxonomy (Prompt 13A).
 *
 * One authoritative storage kind per canonical item type. An Inbox item exists
 * only when it carries a meaningful household outcome. Awareness-only
 * information and kinds without a valid outcome are not Inbox items.
 */

/** Canonical Inbox item type discriminator (single source of truth). */
export const InboxItemKind = {
  UNMAPPED_EXPENSE: "unmapped_expense",
  INCOME_SUGGEST: "income_suggest",
  SAVINGS_MATURITY: "savings_maturity",
  EARLY_WITHDRAWAL_CONFIRMATION: "early_withdrawal_confirmation",
  EMI_COMPLETE: "emi_complete",
  EMERGENCY_DECLARATION: "emergency_declaration",
} as const;

export type InboxItemKind = (typeof InboxItemKind)[keyof typeof InboxItemKind];

export const INBOX_ITEM_KIND_VALUES = Object.values(InboxItemKind);

export const InboxContextEnvelopeKey = {
  DATA: "data",
} as const;

/**
 * Storage kinds persisted by older migrations but no longer part of the
 * canonical taxonomy. Never produced by the current codebase; any surviving
 * rows are historical and must never surface in the active queue.
 */
export const INBOX_LEGACY_KIND_VALUES = [
  "savings_matured",
  "renewal_required",
  "penalty_warning",
  "rate_changed_suggestion",
  "package_expired",
  "payment_reminder",
] as const;

export type InboxLegacyKind = (typeof INBOX_LEGACY_KIND_VALUES)[number];

/** Legacy storage kinds that map onto a canonical kind at the read boundary. */
export const INBOX_KIND_MIGRATION_MAP: Readonly<
  Record<InboxLegacyKind, InboxItemKind | null>
> = {
  savings_matured: InboxItemKind.SAVINGS_MATURITY,
  renewal_required: InboxItemKind.SAVINGS_MATURITY,
  penalty_warning: null,
  rate_changed_suggestion: null,
  package_expired: null,
  payment_reminder: null,
} as const;

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

export const INBOX_ITEM_STATUS_VALUES = Object.values(InboxItemStatus);

/** Statuses shown on the Inbox Archived tab (BR-15). */
export const INBOX_ARCHIVED_STATUS_VALUES = [
  InboxItemStatus.EXPIRED,
  InboxItemStatus.AUTO_RESOLVED,
  InboxItemStatus.ARCHIVED,
  InboxItemStatus.RESOLVED,
  InboxItemStatus.DISMISSED,
  InboxItemStatus.ACKNOWLEDGED,
] as const;

/** Open vs Archived queue tabs (query `tab`). */
export const InboxQueueTab = {
  OPEN: "open",
  ARCHIVED: "archived",
} as const;

export type InboxQueueTab = (typeof InboxQueueTab)[keyof typeof InboxQueueTab];

/** Receipt query values after a successful Inbox outcome. */
export const InboxReceiptKind = {
  JAR: "jar",
  SAVINGS: "savings",
  ATTENTION: "attention",
} as const;

export type InboxReceiptKind =
  (typeof InboxReceiptKind)[keyof typeof InboxReceiptKind];

export const INBOX_RECEIPT_KIND_VALUES = Object.values(InboxReceiptKind);

/** Query key for post-decision receipt on the Inbox queue. */
export const INBOX_RECEIPT_QUERY = "receipt";

/** Query key for Open/Archived queue tabs. */
export const INBOX_TAB_QUERY = "tab";

export const InboxSourceType = {
  TRANSACTION: "transaction",
  GUIDED: "guided",
  PLAN_MOVEMENT: "plan_movement",
} as const;

export type InboxSourceType =
  (typeof InboxSourceType)[keyof typeof InboxSourceType];

export const INBOX_SOURCE_TYPE_VALUES = Object.values(InboxSourceType);

export const INBOX_RPC = {
  RESOLVE_TO_JAR: "resolve_inbox_item_to_jar",
  DISMISS: "dismiss_inbox_item",
  ACKNOWLEDGE: "acknowledge_inbox_item",
  AUTO_RESOLVE: "auto_resolve_inbox_item",
  STALENESS_WORKER: "run_inbox_staleness_worker",
} as const;

export const INBOX_OPERATION = {
  LIST_OPEN: "listOpenInboxItems",
  LIST_ARCHIVED: "listArchivedInboxItems",
  GET_ITEM: "getInboxItem",
  RESOLVE_TO_JAR: "resolveInboxItemToJar",
  DISMISS: "dismissInboxItem",
  ACKNOWLEDGE: "acknowledgeInboxItem",
  AUTO_RESOLVE: "autoResolveInboxItem",
  STALENESS_WORKER: "runInboxStalenessWorker",
  DECISION_PANEL: "inboxDecisionPanel",
  SAVINGS_MATURITY_SYNC: "syncSavingsMaturityInboxItems",
  SAVINGS_EARLY_WITHDRAWAL_UPSERT: "upsertSavingsEarlyWithdrawalInboxItem",
} as const;

export const SAVINGS_INBOX_CONTEXT = {
  EARLY_WITHDRAWAL_TITLE: "Early withdrawal",
  EARLY_CASCADE_DAY: "early",
} as const;

export const INBOX_ERROR_CODE = {
  ITEM_NOT_FOUND: "inbox_item_not_found",
  INVALID_TRANSITION: "inbox_invalid_transition",
  INVALID_ACTION: "inbox_invalid_action",
  INVALID_JAR: "inbox_invalid_jar",
  AUTO_RESOLVE_NOT_ELIGIBLE: "inbox_auto_resolve_not_eligible",
  STALE_ITEM: "inbox_stale_item",
  PERMISSION_DENIED: "inbox_permission_denied",
  REMOVED_KIND: "inbox_removed_kind",
  INVALID_SOURCE_TYPE: "inbox_invalid_source_type",
  INVALID_ASSIGNEE: "inbox_invalid_assignee",
  MISSING_CONTEXT: "inbox_missing_context",
} as const;

export type InboxErrorCode =
  (typeof INBOX_ERROR_CODE)[keyof typeof INBOX_ERROR_CODE];

/** Compatibility markers for Inbox RPCs that still raise text exceptions. */
export const INBOX_LEGACY_RPC_ERROR_MARKERS = {
  UNAUTHENTICATED: ["authentication required"],
  NO_MEMBERSHIP: ["active household membership required"],
  PERMISSION_DENIED: ["forbidden"],
  ITEM_NOT_FOUND: ["inbox item not found"],
  INVALID_ACTION: ["invalid maturity action", "invalid emi action"],
  INVALID_JAR: ["invalid jar"],
  AUTO_RESOLVE_NOT_ELIGIBLE: [
    "item kind cannot be auto-resolved",
    "confidence below auto-resolve threshold",
    "suggested jar required for auto-resolve",
  ],
  INVALID_TRANSITION: [
    "item cannot be resolved to a jar",
    "item has no ledger source",
    "item cannot be acknowledged",
  ],
  STALE_ITEM: ["stale item", "item has expired"],
  REMOVED_KIND: ["removed inbox kind cannot be produced", "unknown inbox kind"],
  INVALID_SOURCE_TYPE: [
    "invalid inbox source type",
    "invalid source type for kind",
  ],
  INVALID_ASSIGNEE: [
    "invalid assignee",
    "assignment is only valid for emergency declarations",
  ],
  MISSING_CONTEXT: [
    "missing required source context",
    "missing savings maturity context",
    "missing early withdrawal context",
    "missing installment/debt context",
    "emergency intent note required",
  ],
} as const;

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

export const SAVINGS_MATURITY_ACK_ACTION_VALUES = Object.values(
  SavingsMaturityAckAction,
);

export const EarlyWithdrawalAckAction = {
  CONFIRM: "confirm",
  CANCEL: "cancel",
  DISMISS: "dismiss",
} as const;

export type EarlyWithdrawalAckAction =
  (typeof EarlyWithdrawalAckAction)[keyof typeof EarlyWithdrawalAckAction];

export const EARLY_WITHDRAWAL_ACK_ACTION_VALUES = Object.values(
  EarlyWithdrawalAckAction,
);

export const EmiAckAction = {
  CELEBRATE: "celebrate",
  LATER: "later",
} as const;

export type EmiAckAction = (typeof EmiAckAction)[keyof typeof EmiAckAction];

export type InboxAckAction =
  SavingsMaturityAckAction | EarlyWithdrawalAckAction | EmiAckAction;

/** BR-16 — silent auto-resolve when confidence meets this floor. */
export const AUTO_RESOLVE_CONFIDENCE_THRESHOLD = 0.9;

/** BR-16 — merchant rule confirmation count before high confidence. */
export const MERCHANT_CONFIRMATION_THRESHOLD = 3;

/**
 * Canonical lifecycle states (Prompt 13A).
 *
 * Active state: PENDING.
 * Terminal outcomes: RESOLVED, DISMISSED, ACKNOWLEDGED, EXPIRED,
 * AUTO_RESOLVED. ARCHIVED is a history/presentation classification, not a
 * business outcome the user chooses. No read/unread attention state exists by
 * decision (Prompt 13C is deferred until real volume requires it).
 */
export const INBOX_ACTIVE_STATUS_VALUES = [InboxItemStatus.PENDING] as const;

export const INBOX_TERMINAL_STATUS_VALUES = [
  InboxItemStatus.RESOLVED,
  InboxItemStatus.DISMISSED,
  InboxItemStatus.ACKNOWLEDGED,
  InboxItemStatus.EXPIRED,
  InboxItemStatus.AUTO_RESOLVED,
] as const;

export function isJarResolvableKind(kind: InboxItemKind): boolean {
  return (
    kind === InboxItemKind.UNMAPPED_EXPENSE ||
    kind === InboxItemKind.INCOME_SUGGEST
  );
}

export function isGuidedKind(kind: InboxItemKind): boolean {
  return (
    kind === InboxItemKind.SAVINGS_MATURITY ||
    kind === InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION ||
    kind === InboxItemKind.EMI_COMPLETE ||
    kind === InboxItemKind.EMERGENCY_DECLARATION
  );
}

export function isArchivedStatus(status: InboxItemStatus): boolean {
  return (INBOX_ARCHIVED_STATUS_VALUES as readonly string[]).includes(status);
}

/**
 * Map a persisted storage kind to the canonical type at the read boundary.
 * Legacy kinds with no canonical mapping resolve to null so they can never
 * silently enter the active queue (Prompt 13A).
 */
export function mapInboxKind(
  value: string | null | undefined,
): InboxItemKind | null {
  if (!value) return null;
  const canonical = (INBOX_ITEM_KIND_VALUES as readonly string[]).includes(
    value,
  )
    ? (value as InboxItemKind)
    : (INBOX_KIND_MIGRATION_MAP[value as InboxLegacyKind] ?? null);
  return canonical;
}

export function mapInboxStatus(
  value: string | null | undefined,
): InboxItemStatus | null {
  if (!value) return null;
  return (INBOX_ITEM_STATUS_VALUES as readonly string[]).includes(value)
    ? (value as InboxItemStatus)
    : null;
}
