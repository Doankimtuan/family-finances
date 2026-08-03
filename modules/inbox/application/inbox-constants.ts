/**
 * Inbox domain constants — review queue status and kind.
 */

export const InboxItemStatus = {
  PENDING: "pending",
  RESOLVED: "resolved",
} as const;

export type InboxItemStatus =
  (typeof InboxItemStatus)[keyof typeof InboxItemStatus];

export const InboxItemKind = {
  UNMAPPED_EXPENSE: "unmapped_expense",
  INCOME_SUGGEST: "income_suggest",
} as const;

export type InboxItemKind = (typeof InboxItemKind)[keyof typeof InboxItemKind];
