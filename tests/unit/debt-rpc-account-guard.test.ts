import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260820144206_debt_p0_integrity_receipt_gate_10b.sql",
  "utf8",
);

describe("Debt RPC account guard", () => {
  it("wraps the ownership-aware create_debt signature", () => {
    expect(migration).toContain(
      "alter function public.create_debt(text, text, text, text, numeric, date, date, text, uuid, text, text)",
    );
    expect(migration).toContain("p_financial_scope text default 'household'");
    expect(migration).toContain("p_idempotency_key,\n    p_financial_scope");
  });

  it("keeps one SQL policy for both Debt RPC entry points", () => {
    expect(migration).toContain(
      "create or replace function public.is_debt_movement_account_type",
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
    expect(migration).not.toContain("'credit_card'");
    expect(migration).not.toContain("'savings_product'");
  });

  it("does not leave the unchecked implementations callable", () => {
    expect(migration).toContain(
      "revoke all on function public._create_debt_unchecked_10b",
    );
    expect(migration).toContain(
      "revoke all on function public._record_debt_payment_unchecked_10b",
    );
  });
});
