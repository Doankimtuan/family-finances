import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MIGRATIONS = readdirSync("supabase/migrations")
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(`supabase/migrations/${file}`, "utf8"))
  .join("\n");

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
    expect(MIGRATIONS).toContain(
      "revoke all on all functions in schema public from public, anon, authenticated",
    );
    expect(MIGRATIONS).toMatch(
      /grant EXECUTE on function public\.get_invitation_preview\(uuid\) to "anon"/,
    );
  });

  it("keeps the internal helper manifest out of authenticated ACLs", () => {
    for (const helper of INTERNAL_HELPERS) expect(MIGRATIONS).toContain(helper);
    expect(MIGRATIONS).not.toMatch(
      /grant EXECUTE on function public\.(?:_loan_insert_rate_periods|autolock_resolve_unmapped_for_period|ensure_miscellaneous_jar|guard_financial_root_mutation|guard_goal_funding_link_mutation|guard_historical_jar_period_rule_snapshot|guard_inbox_source_mutation|guard_ownership_immutable|guard_transaction_mutation|prevent_owned_membership_delete|assert_financial_mutation|run_month_ritual_autolock_for_household|run_month_ritual_autolock_worker_all).* to "authenticated"/i,
    );
  });

  it("defines the schedule helper called by loan creation", () => {
    const helper =
      MIGRATIONS.match(
        /CREATE OR REPLACE FUNCTION public\._loan_insert_schedule_entries\([\s\S]*?\$function\$;/i,
      )?.[0] ?? "";

    expect(helper.toLowerCase()).toContain(
      "insert into public.loan_schedule_entries",
    );
    expect(helper).toMatch(/SECURITY INVOKER\s+SET search_path TO 'public'/i);
    expect(helper).toContain("(v_item->>'dueDate')::date");
    expect(helper).toContain("(v_item->>'remainingBalanceAfter')::numeric");
    expect(MIGRATIONS).toMatch(
      /REVOKE ALL ON FUNCTION public\._loan_insert_schedule_entries\(uuid, uuid, jsonb\)\s+FROM PUBLIC, anon, authenticated, service_role/i,
    );
    expect(MIGRATIONS).toMatch(
      /GRANT EXECUTE ON FUNCTION public\._loan_insert_schedule_entries\(uuid, uuid, jsonb\)\s+TO postgres/i,
    );
  });

  it("reconciles caller-supplied loan schedules before inserting installments", () => {
    const helper =
      MIGRATIONS.match(
        /CREATE OR REPLACE FUNCTION public\._loan_insert_schedule_entries\([\s\S]*?\$function\$;/i,
      )?.[0] ?? "";
    const validationIndex = helper.indexOf(
      "v_principal_total is distinct from v_loan.principal",
    );
    const insertIndex = helper.indexOf(
      "insert into public.loan_schedule_entries",
    );

    expect(helper).toMatch(
      /jsonb_typeof\(p_entries\) is distinct from 'array'/i,
    );
    expect(helper).toMatch(
      /jsonb_array_length\(p_entries\) <> v_loan\.term_months/i,
    );
    expect(helper).toMatch(/v_sequence is distinct from v_expected_sequence/i);
    expect(helper).toMatch(/jsonb_typeof\(v_item\) is distinct from 'object'/i);
    expect(helper).toMatch(
      /jsonb_typeof\(v_item->'principalDue'\) is distinct from 'number'/i,
    );
    expect(helper).toMatch(
      /jsonb_typeof\(v_item->'dueDate'\) is distinct from 'string'/i,
    );
    expect(helper).toContain("v_sequence_value <> trunc(v_sequence_value)");
    expect(helper).toContain("v_principal_due < 0");
    expect(helper).toMatch(
      /v_total_due is distinct from v_principal_due \+ v_interest_due/i,
    );
    expect(helper).toMatch(
      /v_interest_total is distinct from v_loan\.total_interest/i,
    );
    expect(helper).toMatch(
      /v_repayment_total is distinct from v_loan\.total_repayment/i,
    );
    expect(helper).toContain("interval '1 month'");
    expect(helper).toMatch(/l\.household_id = p_household_id/i);
    expect(validationIndex).toBeGreaterThanOrEqual(0);
    expect(insertIndex).toBeGreaterThan(validationIndex);
  });

  it("recomputes loan amortization policy before accepting schedules and rate periods", () => {
    const scheduleHelper =
      [
        ...MIGRATIONS.matchAll(
          /CREATE OR REPLACE FUNCTION public\._loan_insert_schedule_entries\([\s\S]*?\$function\$;/gi,
        ),
      ].at(-1)?.[0] ?? "";
    const ratePeriodHelper =
      [
        ...MIGRATIONS.matchAll(
          /CREATE OR REPLACE FUNCTION public\._loan_insert_rate_periods\([\s\S]*?\$function\$;/gi,
        ),
      ].at(-1)?.[0] ?? "";
    const policyValidationIndex = scheduleHelper.indexOf(
      "v_interest_due is distinct from v_expected_interest",
    );
    const scheduleInsertIndex = scheduleHelper.indexOf(
      "insert into public.loan_schedule_entries",
    );

    expect(scheduleHelper).toContain("v_monthly_rate := v_annual_rate / 1200");
    expect(scheduleHelper).toContain(
      "v_expected_interest := round(v_previous_balance * v_monthly_rate)",
    );
    expect(scheduleHelper).toContain(
      "v_loan.monthly_payment is distinct from v_expected_principal + v_expected_interest",
    );
    expect(scheduleHelper).toContain(
      "power(1 + v_monthly_rate, v_remaining_periods)",
    );
    expect(policyValidationIndex).toBeGreaterThanOrEqual(0);
    expect(scheduleInsertIndex).toBeGreaterThan(policyValidationIndex);
    expect(ratePeriodHelper).toContain(
      "v_annual_rate is distinct from v_expected_rate",
    );
    expect(ratePeriodHelper).toContain(
      "v_effective_from is distinct from v_switch_date",
    );
  });

  it("pins SECURITY DEFINER search paths", () => {
    const securityDefinerCount = (MIGRATIONS.match(/SECURITY DEFINER/g) ?? [])
      .length;
    const pinnedCount = (
      MIGRATIONS.match(/SECURITY DEFINER[\s\S]{0,160}SET search_path TO /g) ??
      []
    ).length;
    expect(pinnedCount).toBe(securityDefinerCount);
    expect(MIGRATIONS).toContain("transactions_set_is_reversal");
  });
});
