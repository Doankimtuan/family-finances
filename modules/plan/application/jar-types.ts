import {
  JarKind,
  JarState,
  JarPlanKind,
  IncomeAllocateMode,
  RitualMode,
  type JarKind as JarKindValue,
  type JarState as JarStateValue,
  type JarPlanKind as JarPlanKindValue,
  type IncomeAllocateMode as IncomeAllocateModeValue,
  type RitualMode as RitualModeValue,
} from "./plan-constants";

export {
  JarKind,
  JarState,
  JarPlanKind,
  IncomeAllocateMode,
  RitualMode,
  JAR_KIND_VALUES,
  JAR_STATE_VALUES,
  JAR_PLAN_KIND_VALUES,
} from "./plan-constants";

export type JarPlan = {
  kind: JarPlanKindValue;
  /** Basis points: 5000 = 50% */
  percentBps: number;
  fixedAmount: number;
};

export type PlanJar = {
  id: string;
  name: string;
  kind: JarKindValue;
  state: JarStateValue;
  sortOrder: number;
  /** Virtual capacity shifts from plan movements (BR-01). */
  capacityDelta: number;
  plan: JarPlan | null;
};

export type PlanPulse = {
  householdId: string;
  currency: string;
  monthCloseMode: RitualModeValue;
  incomeAllocateMode: IncomeAllocateModeValue;
  activeJars: PlanJar[];
  pausedJarCount: number;
  archivedJarCount: number;
};

export type JarList = {
  householdId: string;
  currency: string;
  incomeAllocateMode: IncomeAllocateModeValue;
  active: PlanJar[];
  paused: PlanJar[];
  archived: PlanJar[];
};

export type JarDetail = PlanJar & {
  householdId: string;
  currency: string;
  incomeAllocateMode: IncomeAllocateModeValue;
};

function asJarKind(value: string): JarKindValue {
  switch (value) {
    case JarKind.SAVINGS:
    case JarKind.BUFFER:
    case JarKind.INCOME:
      return value;
    default:
      return JarKind.SPENDING;
  }
}

export function resolveJarState(row: {
  is_archived: boolean;
  is_paused?: boolean | null;
}): JarStateValue {
  if (row.is_archived) return JarState.ARCHIVED;
  if (row.is_paused) return JarState.PAUSED;
  return JarState.ACTIVE;
}

export function mapJarPlan(
  row:
    | {
        plan_kind: string;
        percent_bps: number | string;
        fixed_amount: number | string;
      }
    | null
    | undefined,
): JarPlan | null {
  if (!row) return null;
  return {
    kind:
      row.plan_kind === JarPlanKind.FIXED
        ? JarPlanKind.FIXED
        : JarPlanKind.PERCENT,
    percentBps: Number(row.percent_bps) || 0,
    fixedAmount: Number(row.fixed_amount) || 0,
  };
}

export function mapJarRow(row: {
  id: string;
  name: string;
  kind: string;
  sort_order: number;
  is_archived: boolean;
  is_paused?: boolean | null;
  capacity_delta?: number | string | null;
  jar_plans?:
    | {
        plan_kind: string;
        percent_bps: number | string;
        fixed_amount: number | string;
      }
    | {
        plan_kind: string;
        percent_bps: number | string;
        fixed_amount: number | string;
      }[]
    | null;
}): PlanJar {
  const planRaw = Array.isArray(row.jar_plans)
    ? row.jar_plans[0]
    : row.jar_plans;
  return {
    id: row.id,
    name: row.name,
    kind: asJarKind(row.kind),
    state: resolveJarState(row),
    sortOrder: row.sort_order,
    capacityDelta: Number(row.capacity_delta) || 0,
    plan: mapJarPlan(planRaw),
  };
}

/** Active allocation target? (BR-03) */
export function isAllocationTarget(jar: Pick<PlanJar, "state">): boolean {
  return jar.state === JarState.ACTIVE;
}

export function mapIncomeAllocateMode(
  value: string | null | undefined,
): IncomeAllocateModeValue {
  if (value === IncomeAllocateMode.OFF || value === IncomeAllocateMode.AUTO) {
    return value;
  }
  return IncomeAllocateMode.SUGGEST;
}

export function mapMonthCloseMode(
  value: string | null | undefined,
): RitualModeValue {
  if (value === RitualMode.AUTO || value === RitualMode.MANUAL) return value;
  return RitualMode.ASSISTED;
}
