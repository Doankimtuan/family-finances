import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MIGRATION = readFileSync(
  "supabase/migrations/20260825125516_v1_baseline.sql",
  "utf8",
);

const INTERNAL_HELPERS = [
  "_loan_insert_rate_periods",
  "_loan_insert_schedule_entries",
  "_loan_replace_upcoming_schedule",
  "autolock_resolve_unmapped_for_period",
  "ensure_miscellaneous_jar",
  "enforce_goal_funding_link_integrity",
  "get_or_create_savings_product_account",
  "guard_cross_resource_mutation",
  "guard_financial_root_mutation",
  "guard_goal_funding_link_mutation",
  "guard_historical_jar_period_rule_snapshot",
  "guard_inbox_source_mutation",
  "guard_ownership_immutable",
  "guard_transaction_mutation",
  "prevent_owned_membership_delete",
  "assert_financial_mutation",
  "run_month_ritual_autolock_for_household",
  "run_month_ritual_autolock_worker_all",
] as const;

describe("Canonical RPC ACL hardening", () => {
  it("revokes inherited PUBLIC/anon execution and preserves preview access", () => {
    expect(MIGRATION).toContain(
      "revoke all on all functions in schema public from public, anon, authenticated",
    );
    expect(MIGRATION).toMatch(
      /grant EXECUTE on function public\.get_invitation_preview\(uuid\) to "anon"/,
    );
  });

  it("keeps the internal helper manifest out of authenticated ACLs", () => {
    for (const helper of INTERNAL_HELPERS) expect(MIGRATION).toContain(helper);
    expect(MIGRATION).not.toMatch(
      /grant EXECUTE on function public\.(?:_loan_insert_rate_periods|autolock_resolve_unmapped_for_period|ensure_miscellaneous_jar|guard_financial_root_mutation|guard_goal_funding_link_mutation|guard_historical_jar_period_rule_snapshot|guard_inbox_source_mutation|guard_ownership_immutable|guard_transaction_mutation|prevent_owned_membership_delete|assert_financial_mutation|run_month_ritual_autolock_for_household|run_month_ritual_autolock_worker_all).* to "authenticated"/i,
    );
  });

  it("pins SECURITY DEFINER search paths", () => {
    const securityDefinerCount = (MIGRATION.match(/SECURITY DEFINER/g) ?? [])
      .length;
    const pinnedCount = (
      MIGRATION.match(/SECURITY DEFINER[\s\S]{0,160}SET search_path TO /g) ?? []
    ).length;
    expect(pinnedCount).toBe(securityDefinerCount);
    expect(MIGRATION).toContain("transactions_set_is_reversal");
  });
});
