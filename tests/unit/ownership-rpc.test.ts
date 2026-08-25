import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260825125516_v1_baseline.sql",
  "utf8",
);

describe("Prompt 14D ownership boundary", () => {
  it("installs one shared guard across roots and cross-resource writes", () => {
    expect(migration).toContain("can_mutate_financial_resource");
    expect(migration).toContain("ownership_rpc_transaction_guard");
    expect(migration).toContain("ownership_rpc_cross_resource_guard");
    expect(migration).toContain("ownership_rpc_inbox_source_guard");
    expect(migration).toContain("raise exception 'not_allowed'");
  });
});
