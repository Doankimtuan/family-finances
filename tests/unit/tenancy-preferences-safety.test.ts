import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION = "supabase/migrations/20260825125516_v1_baseline.sql";

describe("Tenancy preference mutation boundaries", () => {
  it("keeps the final tenancy schema contract present", () => {
    const sql = readFileSync(join(process.cwd(), MIGRATION), "utf8");
    expect(sql).toContain('create table "public"."households"');
    expect(sql).toContain("update_household_preferences");
    expect(sql).toContain("update_household_policies");
  });

  it("does not introduce owner or custom household roles", () => {
    const sql = readFileSync(join(process.cwd(), MIGRATION), "utf8");
    expect(sql).toContain("v_role not in ('partner', 'admin')");
    expect(sql).not.toContain("'owner'");
    expect(sql).not.toContain("'viewer'");
  });
});
