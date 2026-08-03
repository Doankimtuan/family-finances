/**
 * Plan domain constants — jars, goals, recurring, ritual.
 */

import { TransactionDirection } from "@/modules/ledger/application/ledger-constants";

export const JarKind = {
  SPENDING: "spending",
  SAVINGS: "savings",
  BUFFER: "buffer",
  INCOME: "income",
} as const;

export type JarKind = (typeof JarKind)[keyof typeof JarKind];

export const JAR_KIND_VALUES = [
  JarKind.SPENDING,
  JarKind.SAVINGS,
  JarKind.BUFFER,
  JarKind.INCOME,
] as const;

export const JarState = {
  ACTIVE: "active",
  PAUSED: "paused",
  ARCHIVED: "archived",
} as const;

export type JarState = (typeof JarState)[keyof typeof JarState];

export const JAR_STATE_VALUES = [
  JarState.ACTIVE,
  JarState.PAUSED,
  JarState.ARCHIVED,
] as const;

export const JarPlanKind = {
  PERCENT: "percent",
  FIXED: "fixed",
} as const;

export type JarPlanKind = (typeof JarPlanKind)[keyof typeof JarPlanKind];

export const JAR_PLAN_KIND_VALUES = [
  JarPlanKind.PERCENT,
  JarPlanKind.FIXED,
] as const;

export const GoalStatus = {
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];

export const GOAL_STATUS_VALUES = [
  GoalStatus.ACTIVE,
  GoalStatus.PAUSED,
  GoalStatus.COMPLETED,
  GoalStatus.CANCELLED,
] as const;

export const RecurringDirection = TransactionDirection;
export type RecurringDirection =
  (typeof RecurringDirection)[keyof typeof RecurringDirection];

export const RECURRING_DIRECTION_OPTIONS = [
  RecurringDirection.EXPENSE,
  RecurringDirection.INCOME,
] as const;

export const RecurringFrequency = {
  WEEKLY: "weekly",
  MONTHLY: "monthly",
} as const;

export type RecurringFrequency =
  (typeof RecurringFrequency)[keyof typeof RecurringFrequency];

export const RECURRING_FREQUENCY_VALUES = [
  RecurringFrequency.WEEKLY,
  RecurringFrequency.MONTHLY,
] as const;

export const IncomeAllocateMode = {
  OFF: "off",
  SUGGEST: "suggest",
  AUTO: "auto",
} as const;

export type IncomeAllocateMode =
  (typeof IncomeAllocateMode)[keyof typeof IncomeAllocateMode];

export const INCOME_ALLOCATE_MODE_VALUES = [
  IncomeAllocateMode.OFF,
  IncomeAllocateMode.SUGGEST,
  IncomeAllocateMode.AUTO,
] as const;

export const RitualMode = {
  ASSISTED: "assisted",
  AUTO: "auto",
  MANUAL: "manual",
} as const;

export type RitualMode = (typeof RitualMode)[keyof typeof RitualMode];

export const RITUAL_MODE_VALUES = [
  RitualMode.ASSISTED,
  RitualMode.AUTO,
  RitualMode.MANUAL,
] as const;

export const RitualStatus = {
  DRAFT: "draft",
  PREVIEWED: "previewed",
  APPROVED: "approved",
  CORRECTED: "corrected",
} as const;

export type RitualStatus = (typeof RitualStatus)[keyof typeof RitualStatus];

export const RITUAL_STATUS_VALUES = [
  RitualStatus.DRAFT,
  RitualStatus.PREVIEWED,
  RitualStatus.APPROVED,
  RitualStatus.CORRECTED,
] as const;
