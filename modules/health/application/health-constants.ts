export const HealthAssessmentState = {
  UNAVAILABLE: "unavailable",
  NO_VISIBLE_FACTS: "no_visible_facts",
  PARTIAL: "partial",
  STARTING: "starting",
  STEADY: "steady",
  STRONG: "strong",
  STALE: "stale",
  INVALID_ATTEMPT: "invalid_attempt",
} as const;

export type HealthAssessmentState =
  (typeof HealthAssessmentState)[keyof typeof HealthAssessmentState];

export const HealthSourceKind = {
  ACCOUNTS: "accounts",
  TRANSACTIONS: "transactions",
  PLAN_JARS: "plan_jars",
  INBOX: "inbox",
} as const;

export type HealthSourceKind =
  (typeof HealthSourceKind)[keyof typeof HealthSourceKind];

export const HEALTH_SOURCE_QUERY = {
  ORIGIN: "origin",
  FACTOR: "factor",
} as const;

export const HEALTH_SOURCE_TOTAL = 4;
