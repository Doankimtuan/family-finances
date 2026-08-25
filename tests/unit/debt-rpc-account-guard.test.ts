import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260825125516_v1_baseline.sql",
  "utf8",
);

describe("Debt RPC account guard", () => {
  it("wraps the ownership-aware create_debt signature", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.create_debt",
    );
    expect(migration).toContain("p_financial_scope text DEFAULT 'household'");
    expect(migration).toContain("p_idempotency_key");
  });

  it("keeps one SQL policy for both Debt RPC entry points", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.is_debt_movement_account_type",
    );
    expect(migration).toContain("public.is_debt_movement_account_type(a.type)");
    expect(
      migration.match(/public\.is_debt_movement_account_type\(a\.type\)/g),
    ).toHaveLength(2);
  });

  it("allows only the liquid account types", () => {
    for (const type of [
      "cash",
      "checking",
      "savings",
      "ewallet",
      "brokerage",
      "other",
    ]) {
      expect(migration).toContain(`'${type}'`);
    }
    expect(migration).toContain("'credit_card'");
    expect(migration).toContain("'savings_product'");
  });

  it("does not leave the unchecked implementations callable", () => {
    expect(migration).toContain(
      "revoke all on all functions in schema public from public, anon, authenticated",
    );
    expect(migration).not.toMatch(
      /grant EXECUTE on function public\._(?:create_debt|record_debt_payment)_unchecked_10b.*to "(?:anon|authenticated)"/i,
    );
  });
});
