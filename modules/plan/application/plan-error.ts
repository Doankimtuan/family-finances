import { logActionFailure } from "@/modules/shared-kernel/application/log-action-failure";
import type { PlanOperation } from "./plan-constants";

export type PlanFailureContext = Readonly<{
  householdId?: string;
  goalId?: string;
  ruleId?: string;
  jarId?: string;
  periodMonth?: string;
  responseInvalid?: boolean;
}>;

export function logPlanFailure(
  error: unknown,
  operation: PlanOperation,
  context: PlanFailureContext,
): void {
  logActionFailure({ operation, error, context });
}
