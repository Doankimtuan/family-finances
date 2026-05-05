export const JARS_CONSTANTS = {
  SLUG: {
    MAX_LENGTH: 60,
    DEFAULT_PREFIX: "jar",
  },
  DEFAULTS: {
    COLOR: "#2563EB",
    ICON: "piggy-bank",
    JAR_TYPE: "custom",
    SPEND_POLICY: "flexible",
  },
  VALIDATION: {
    NAME_MIN_LENGTH: 2,
    MONTH_REGEX: /^\d{4}-\d{2}$/,
  },
  REVIEW: {
    MAX_DISPLAYED: 5,
    MAX_SUGGESTED_ALLOCATIONS: 3,
  },
} as const;
