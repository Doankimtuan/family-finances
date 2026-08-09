import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION =
  "supabase/migrations/20260809135427_phase_f7_tenancy_preferences_roles.sql";

describe("Phase F7 mutation boundaries", () => {
  it("keeps the tenancy migration away from financial tables", () => {
    const sql = readFileSync(join(process.cwd(), MIGRATION), "utf8");
    for (const forbiddenTable of [
      "public.accounts",
      "public.transactions",
      "public.jars",
      "public.inbox_items",
      "public.savings",
      "public.loans",
    ]) {
      expect(sql).not.toContain(forbiddenTable);
    }
  });

  it("does not introduce owner or custom household roles", () => {
    const sql = readFileSync(join(process.cwd(), MIGRATION), "utf8");
    expect(sql).toContain("v_role not in ('partner', 'admin')");
    expect(sql).not.toContain("'owner'");
    expect(sql).not.toContain("'viewer'");
  });
});
