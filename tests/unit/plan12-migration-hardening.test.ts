import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { mapJarRow } from "@/modules/plan/application/jar-types";

const ROOT = resolve(process.cwd());
const migration = (name: string) =>
  readFileSync(resolve(ROOT, "supabase/migrations", name), "utf8");

const PLAN_V2_MIGRATIONS = [
  "20260816150000_plan_v2_jar_rollover_adjustments.sql",
  "20260816160000_plan_v2_goal_funding.sql",
  "20260816161500_plan12_fix_goal_funding_rls_household_check.sql",
  "20260816162000_plan12_revoke_anon_plan_function_acl.sql",
  "20260816170000_plan_v2_review_snapshots.sql",
  "20260816173000_plan_v2_monthly_review.sql",
  "20260816180000_plan_v2_qualifying_monthly_income.sql",
  "20260816190000_plan_v2_jar_category_mapping.sql",
  "20260816200000_plan_v2_jar_budget_snapshots.sql",
  "20260816210000_plan10_goal_actions.sql",
] as const;

describe("Plan 12 migration hardening", () => {
  it("keeps the final local Plan V2 sequence deterministic", () => {
    const migrationFiles = Object.keys(
      import.meta.glob("/supabase/migrations/*plan*.sql", {
        query: "?url",
        import: "default",
        eager: true,
      }),
    );
    const names = migrationFiles
      .map((file) => file.split("/").at(-1))
      .filter((file): file is string => file !== undefined)
      .filter((file) => file.startsWith("20260816"))
      .sort();

    expect(names).toEqual([...PLAN_V2_MIGRATIONS].sort());
  });

  it("repairs Goal action RPCs as atomic, membership-checked security-definer functions", () => {
    const sql = migration("20260816210000_plan10_goal_actions.sql");

    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("public.is_household_member(v_from.household_id)");
    expect(sql).toContain("v_link.household_id <> v_from.household_id");
    expect(sql).toContain("initial_principal_snapshot");
    expect(sql).toContain("set is_active = false");
    expect(sql).not.toMatch(/set is\s+set|holding_,|p_en p_action/);
  });

  it("backfills capacity_delta once using the household-local current period", () => {
    const sql = migration(
      "20260816150000_plan_v2_jar_rollover_adjustments.sql",
    );

    expect(sql).toContain("join public.households h on h.id = j.household_id");
    expect(sql).toContain(
      "timezone(coalesce(nullif(h.timezone, ''), 'Asia_Ho_Chi_Minh'), now())",
    );
    expect(sql).toContain("a.note = 'migrated_from_capacity_delta'");
    expect(sql).toContain("Deprecated V1 compatibility field");
    expect(sql).not.toContain("date_trunc('month', timezone('utc', now()))");
  });

  it("keeps Review metadata and Jar rule snapshots owned by separate migrations", () => {
    const reviewSql = migration("20260816170000_plan_v2_review_snapshots.sql");
    const monthlyReviewSql = migration(
      "20260816173000_plan_v2_monthly_review.sql",
    );

    expect(reviewSql).toContain("review_status");
    expect(reviewSql).toContain("goal_period_funded_snapshots");
    expect(reviewSql).not.toContain(
      "create table if not exists public.jar_period_rule_snapshots",
    );
    expect(monthlyReviewSql).toContain("viewed_at");
    expect(monthlyReviewSql).toContain("reviewed_at");
    expect(monthlyReviewSql).toContain("review_snapshot");
  });

  it("keeps live Jar snapshots append-only and refuses historical reconstruction", () => {
    const source = readFileSync(
      resolve(
        ROOT,
        "modules/plan/application/queries/get-current-jar-budgets.ts",
      ),
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
