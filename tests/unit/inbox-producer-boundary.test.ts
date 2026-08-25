// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const BASELINE = readFileSync(
  "supabase/migrations/20260825125516_v1_baseline.sql",
  "utf8",
);

describe("Inbox producer boundary", () => {
  it("defines the canonical gateway and dedupe key", () => {
    expect(BASELINE).toMatch(
      /create or replace function public\.produce_inbox_item/i,
    );
    expect(BASELINE).toContain('"dedupe_key" text');
    expect(BASELINE).toContain("inbox_items_dedupe_key_unique");
  });

  it("preserves the removed-kind rejection boundary", () => {
    for (const kind of [
      "savings_matured",
      "renewal_required",
      "penalty_warning",
      "rate_changed_suggestion",
      "package_expired",
      "payment_reminder",
    ]) {
      expect(BASELINE).toContain(kind);
    }
  });

  it("preserves cycle-scoped dedupe and reopen policy", () => {
    expect(BASELINE).toContain("v_cycle_key");
    expect(BASELINE).toContain("emi_complete");
    expect(BASELINE).toContain("status = 'pending'");
    expect(BASELINE).toContain("status = 'expired'");
  });

  it("keeps the stable loan/debt attention identities", () => {
    for (const value of [
      "loan_payment_attention",
      "debt_payment_attention",
      "loan-payment-attention",
      "debt-payment-attention",
      "resolved_by_source_condition",
      "sync_loan_debt_attention_inbox",
    ]) {
      expect(BASELINE).toContain(value);
    }
  });
});
