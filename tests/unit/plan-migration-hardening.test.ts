import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mapJarRow } from "@/modules/plan/application/jar-types";

const BASELINE = readFileSync(
  "supabase/migrations/20260825125516_v1_baseline.sql",
  "utf8",
);

describe("Canonical Plan V1 schema", () => {
  it("defines the final Plan tables and action RPCs in one baseline", () => {
    expect(BASELINE).toContain('create table "public"."jar_plans"');
    expect(BASELINE).toContain('create table "public"."goal_funding_links"');
    expect(BASELINE).toContain('create table "public"."month_ritual_runs"');
    expect(BASELINE).toContain("change_goal_lifecycle");
    expect(BASELINE).toContain("reallocate_jar_capacity");
  });

  it("pins Plan SECURITY DEFINER functions and keeps household ownership checks", () => {
    expect(BASELINE).toContain("SET search_path TO 'public'");
    expect(BASELINE).toContain("public.is_household_member");
    expect(BASELINE).toContain("public.is_household_admin");
  });

  it("keeps live Jar snapshots append-only and refuses historical reconstruction", () => {
    const source = readFileSync(
      "modules/plan/application/queries/get-current-jar-budgets.ts",
      "utf8",
    );

    expect(source).toContain(
      "existing.has(key) || selectedPeriod.month !== currentPeriod",
    );
    expect(source).not.toContain("updates.push");
    expect(source).not.toContain(
      '.from("jar_period_rule_snapshots")\n      .update',
    );
  });

  it("does not let a compatibility row field control live Jar state", () => {
    const jar = mapJarRow({
      id: "00000000-0000-0000-0000-000000000001",
      name: "Essentials",
      kind: "spending",
      sort_order: 0,
      is_archived: false,
      capacity_delta: 900000,
      rollover_mode: "reset",
      jar_plans: {
        plan_kind: "fixed",
        percent_bps: 0,
        fixed_amount: 1000000,
      },
    });

    expect(jar.capacityDelta).toBe(0);
  });
});
