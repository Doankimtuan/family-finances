export type JarKind = "spending" | "savings" | "buffer" | "income";

/** Active = allocation target (BR-03 / AC-003). Archived are non-targets. */
export type JarState = "active" | "archived";

export type PlanJar = {
  id: string;
  name: string;
  kind: JarKind;
  state: JarState;
  sortOrder: number;
};

export type PlanPulse = {
  householdId: string;
  currency: string;
  monthCloseMode: "assisted" | "auto" | "manual";
  incomeAllocateMode: "off" | "suggest" | "auto";
  activeJars: PlanJar[];
  archivedJarCount: number;
};

function asJarKind(value: string): JarKind {
  switch (value) {
    case "savings":
    case "buffer":
    case "income":
      return value;
    default:
      return "spending";
  }
}

export function mapJarRow(row: {
  id: string;
  name: string;
  kind: string;
  sort_order: number;
  is_archived: boolean;
}): PlanJar {
  return {
    id: row.id,
    name: row.name,
    kind: asJarKind(row.kind),
    state: row.is_archived ? "archived" : "active",
    sortOrder: row.sort_order,
  };
}
