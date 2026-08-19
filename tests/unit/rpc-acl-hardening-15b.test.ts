import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MIGRATION = readFileSync(
  "supabase/migrations/20260818160000_rpc_acl_security_hardening_15b.sql",
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

describe("15B RPC ACL hardening", () => {
  it("revokes inherited PUBLIC/anon execution and hardens future defaults", () => {
    expect(MIGRATION).toContain(
      "revoke execute on function %s from public, anon",
    );
    expect(MIGRATION).toContain(
      "revoke execute on functions from public, anon, authenticated",
    );
    expect(MIGRATION).toContain(
      "grant execute on function public.get_invitation_preview(uuid) to anon",
    );
  });

  it("keeps an explicit internal helper manifest without authenticated grants", () => {
    for (const helper of INTERNAL_HELPERS) {
      expect(MIGRATION).toContain(`'${helper}'`);
    }
    expect(MIGRATION).toContain(
      "revoke execute on function %s from authenticated",
    );
    expect(MIGRATION).not.toMatch(
      /grant execute on function public\.(?:_loan_insert|autolock_resolve|ensure_miscellaneous|get_or_create_savings_product_account|run_month_ritual_autolock_for_household|run_month_ritual_autolock_worker_all).* to authenticated/i,
    );
  });

  it("pins the known mutable trigger search_path", () => {
    expect(MIGRATION).toContain(
      "alter function public.transactions_set_is_reversal()",
    );
    expect(MIGRATION).toContain("set search_path = public;");
  });
});
