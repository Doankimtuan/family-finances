export const GOAL_TYPES = [
  { label: "goals.types.emergency_fund", value: "emergency_fund" },
  { label: "goals.types.property_purchase", value: "property_purchase" },
  { label: "goals.types.house_construction", value: "house_construction" },
  { label: "goals.types.vehicle", value: "vehicle" },
  { label: "goals.types.education", value: "education" },
  { label: "goals.types.retirement", value: "retirement" },
  { label: "goals.types.custom", value: "custom" },
] as const;

export const PRIORITY_OPTIONS = [
  { label: "goals.priority.1", value: 1 },
  { label: "goals.priority.2", value: 2 },
  { label: "goals.priority.3", value: 3 },
  { label: "goals.priority.4", value: 4 },
  { label: "goals.priority.5", value: 5 },
] as const;

export const VALIDATION = {
  MIN_GOAL_NAME_LENGTH: 2,
  MIN_PRIORITY: 1,
  MAX_PRIORITY: 5,
  RECENT_CONTRIBUTION_MONTHS: 6,
  MAX_HISTORY_ITEMS: 3,
  SHORT_DEADLINE_MONTHS: 3,
} as const;

export const FLOW_TYPES = {
  INFLOW: "inflow",
  OUTFLOW: "outflow",
} as const;

export const PACE_STATUS = {
  ON_TRACK: "on_track",
  BEHIND: "behind",
  NO_DEADLINE: "no_deadline",
  COMPLETED: "completed",
} as const;
