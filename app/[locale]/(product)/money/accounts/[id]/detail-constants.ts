export const ACCOUNT_DETAIL_PREVIEW_CONFIG = {
  RECENT_ACTIVITY_LIMIT: 4,
  INSTALLMENT_LIMIT: 2,
  STATEMENT_LIMIT: 1,
  CARD_ACTIVITY_LIMIT: 4,
} as const;

export const ACCOUNT_DETAIL_SHEET = {
  MANAGEMENT: "management",
  PAYMENT: "payment",
  REFUND: "refund",
} as const;

export type AccountDetailSheet =
  (typeof ACCOUNT_DETAIL_SHEET)[keyof typeof ACCOUNT_DETAIL_SHEET];

export const ACCOUNT_DETAIL_MODE = {
  MANAGE: "manage",
  EDIT: "edit",
  ARCHIVE: "archive",
} as const;

export type AccountDetailMode =
  (typeof ACCOUNT_DETAIL_MODE)[keyof typeof ACCOUNT_DETAIL_MODE];
