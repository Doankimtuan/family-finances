/**
 * Query Key Factory for TanStack Query
 * Centralized query key management for consistent cache invalidation
 */

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
  activity: () => [...dashboardKeys.all, "activity"] as const,
  goals: () => [...dashboardKeys.all, "goals"] as const,
  core: () => [...dashboardKeys.all, "core"] as const,
} as const;

export const savingsKeys = {
  all: ["savings"] as const,
  list: () => [...savingsKeys.all, "list"] as const,
  summary: () => [...savingsKeys.all, "summary"] as const,
  detail: (id: string) => [...savingsKeys.all, "detail", id] as const,
  maturityTimeline: () => [...savingsKeys.all, "maturity-timeline"] as const,
} as const;

export const transactionKeys = {
  all: ["transactions"] as const,
  list: () => [...transactionKeys.all, "list"] as const,
  detail: (id: string) => [...transactionKeys.all, "detail", id] as const,
  paginated: (cursor?: string) => [...transactionKeys.all, "paginated", cursor] as const,
} as const;

export const accountKeys = {
  all: ["accounts"] as const,
  list: () => [...accountKeys.all, "list"] as const,
  detail: (id: string) => [...accountKeys.all, "detail", id] as const,
} as const;

export const categoryKeys = {
  all: ["categories"] as const,
  list: () => [...categoryKeys.all, "list"] as const,
  detail: (id: string) => [...categoryKeys.all, "detail", id] as const,
} as const;

export const goalKeys = {
  all: ["goals"] as const,
  list: () => [...goalKeys.all, "list"] as const,
  detail: (id: string) => [...goalKeys.all, "detail", id] as const,
} as const;

export const jarKeys = {
  all: ["jars"] as const,
  list: () => [...jarKeys.all, "list"] as const,
  detail: (id: string) => [...jarKeys.all, "detail", id] as const,
  month: (month: string) => [...jarKeys.all, "month", month] as const,
} as const;

export const healthKeys = {
  all: ["health"] as const,
  snapshot: () => [...healthKeys.all, "snapshot"] as const,
  history: (months?: number) => [...healthKeys.all, "history", months] as const,
} as const;
