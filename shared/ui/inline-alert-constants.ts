export const InlineAlertVariant = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  SUCCESS: "success",
} as const;

export type InlineAlertVariant =
  (typeof InlineAlertVariant)[keyof typeof InlineAlertVariant];
