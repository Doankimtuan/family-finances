// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Ownership-aware RLS (Prompt 14C).
 *
 * Statically verifies the migration that replaces the 14B interim
 * force_household_scope lock with real ownership-aware table security:
 *   1. authorization helpers (active_membership_id, can_mutate_financial_resource,
 *      is_resource_owner, can_admin_cleanup) are SECURITY DEFINER with pinned
 *      search_path and execute granted to authenticated only,
 *   2. ownership immutability trigger on the five writable roots,
 *   3. ownership-aware policies on the six roots (read = active member,
 *      write = household OR active owner),
 *   4. inherited child policies join the parent and use the same helpers,
 *   5. narrow Admin archive RPC (no broad admin UPDATE),
 *   6. the 14B force_household_scope trigger is dropped ONLY after the
 *      replacement policies are installed,
 *   7. Plan and Inbox are not touched,
 *   8. production capability remains disabled: ownership columns stay
 *      REVOKEd from authenticated (defense in depth; RLS is authoritative),
 *   9. no RPC / app flow forwards the ownership columns.
 */

const MIGRATIONS_DIR = `${process.cwd()}/supabase/migrations`;
const MIGRATION = "20260818032212_ownership_aware_rls.sql";
const SQL = readFileSync(`${MIGRATIONS_DIR}/${MIGRATION}`, "utf8");

const ROOTS = [
  "accounts",
  "savings",
  "loans",
  "liabilities",
  "goals",
] as const;

const SELECT_ONLY_ROOTS = ["investment_holdings"] as const;

/** Child tables that must inherit ownership through their parent. */
const INHERITED_CHILDREN = [
  { table: "transactions", parent: "accounts", fk: "account_id" },
  { table: "saving_cycles", parent: "savings", fk: "saving_id" },
  { table: "early_withdrawals", parent: "savings", fk: "saving_id" },
  { table: "loan_payments", parent: "loans", fk: "loan_id" },
  { table: "loan_schedule_entries", parent: "loans", fk: "loan_id" },
  { table: "loan_interest_rate_periods", parent: "loans", fk: "loan_id" },
  { table: "debt_payments", parent: "liabilities", fk: "liability_id" },
  { table: "goal_contributions", parent: "goals", fk: "goal_id" },
  { table: "goal_funding_links", parent: "goals", fk: "goal_id" },
  { table: "credit_card_settings", parent: "accounts", fk: "account_id" },
  { table: "card_billing_months", parent: "accounts", fk: "card_account_id" },
  { table: "card_billing_items", parent: "accounts", fk: "card_account_id" },
  { table: "card_payments", parent: "accounts", fk: "card_account_id" },
  {
    table: "card_payment_applications",
    parent: "card_payments",
    fk: "card_payment_id",
  },
  {
    table: "credit_card_installment_schedule",
    parent: "credit_card_installments",
    fk: "installment_id",
  },
  {
    table: "credit_card_installments",
    parent: "accounts",
    fk: "card_account_id",
  },
  { table: "investment_operations", parent: "investment_holdings", fk: "" },
  { table: "investment_fees", parent: "investment_holdings", fk: "" },
  { table: "investment_valuations", parent: "investment_holdings", fk: "" },
] as const;

/** Plan + Inbox stay household-only (Prompt 14C §16, §17). */
const HOUSEHOLD_ONLY_TABLES = [
  "jars",
  "jar_plans",
  "plan_movements",
  "jar_period_rule_snapshots",
  "jar_period_adjustments",
  "month_ritual_runs",
  "inbox_items",
] as const;

describe("14C ownership-aware RLS — authorization helpers", () => {
  it("defines active_membership_id as SECURITY DEFINER with pinned search_path and auth.uid() identity", () => {
    expect(SQL).toMatch(
      /create or replace function public\.active_membership_id\(p_household_id uuid\)\s+returns uuid\s+language sql\s+stable\s+security definer\s+set search_path = public/,
    );
    expect(SQL).toMatch(/hm\.user_id = auth\.uid\(\)/);
    expect(SQL).toMatch(/hm\.is_active = true/);
  });

  it("defines can_mutate_financial_resource with the canonical household/personal rule", () => {
    expect(SQL).toMatch(
      /create or replace function public\.can_mutate_financial_resource\(\s*p_household_id uuid,\s*p_financial_scope text,\s*p_owner_membership_id uuid\s*\)/,
    );
    // household -> true for any active member; personal -> owner only
    expect(SQL).toMatch(/p_financial_scope = 'household'/);
    expect(SQL).toMatch(/p_financial_scope = 'personal'/);
    expect(SQL).toMatch(/active_membership_id\(p_household_id\) = p_owner_membership_id/);
  });

  it("defines is_resource_owner requiring active membership", () => {
    expect(SQL).toMatch(
      /create or replace function public\.is_resource_owner\(\s*p_household_id uuid,\s*p_owner_membership_id uuid\s*\)/,
    );
    expect(SQL).toMatch(/active_membership_id\(p_household_id\) = p_owner_membership_id/);
  });

  it("defines can_admin_cleanup as a narrow admin predicate", () => {
    expect(SQL).toMatch(
      /create or replace function public\.can_admin_cleanup\(p_household_id uuid\)/,
    );
    expect(SQL).toMatch(/hm\.role = 'admin'/);
    expect(SQL).toMatch(/hm\.is_active = true/);
  });

  it("grants execute to authenticated only (no public/anon) and pins search_path on every helper", () => {
    for (const fn of [
      "active_membership_id",
      "can_mutate_financial_resource",
      "is_resource_owner",
      "can_admin_cleanup",
      "guard_ownership_immutable",
      "admin_archive_financial_resource",
    ]) {
      const section = SQL.match(new RegExp(`function public\\.${fn}\\([\\s\\S]*?\\$\\$;`))?.[0] ?? "";
      expect(section).toMatch(/set search_path = public/);
    }
    expect(
      (SQL.match(/revoke all on function public\.active_membership_id/g) ?? []).length,
    ).toBeGreaterThan(0);
    expect(SQL).toMatch(
      /grant execute on function public\.active_membership_id\(uuid\) to authenticated/,
    );
  });
});

describe("14C ownership-aware RLS — ownership immutability", () => {
  it("defines guard_ownership_immutable comparing OLD vs NEW", () => {
    expect(SQL).toMatch(
      /create or replace function public\.guard_ownership_immutable\(\)/,
    );
    expect(SQL).toMatch(/new\.financial_scope is distinct from old\.financial_scope/);
    expect(SQL).toMatch(/new\.owner_membership_id is distinct from old\.owner_membership_id/);
    expect(SQL).toMatch(/raise exception 'Ownership is immutable/);
  });

  for (const root of ROOTS) {
    it(`${root} has the ownership-immutability trigger`, () => {
      expect(SQL).toMatch(
        new RegExp(
          `create trigger guard_ownership_immutable_trg\\s+before update on public\\.${root}\\s+for each row execute function public\\.guard_ownership_immutable\\(\\)`,
        ),
      );
    });
  }

  it("documented that investment_holdings needs no immutability trigger (select-only)", () => {
    expect(SQL).toMatch(/investment_holdings is select-only to authenticated/);
  });
});

describe("14C ownership-aware RLS — root policies", () => {
  for (const root of ROOTS) {
    it(`${root} SELECT is any active household member`, () => {
      expect(SQL).toMatch(
        new RegExp(
          `create policy ${root}_select_member on public\\.${root}\\s+for select to authenticated\\s+using \\(public\\.active_membership_id\\(household_id\\) is not null\\)`,
        ),
      );
    });

    it(`${root} INSERT uses can_mutate_financial_resource (self-owned personal shape)`, () => {
      expect(SQL).toMatch(
        new RegExp(
          `create policy ${root}_insert_member on public\\.${root}\\s+for insert to authenticated\\s+with check \\(\\s*public\\.can_mutate_financial_resource\\(\\s*household_id, financial_scope, owner_membership_id\\s*\\)`,
        ),
      );
    });

    it(`${root} UPDATE uses can_mutate_financial_resource on using and with check`, () => {
      expect(SQL).toMatch(
        new RegExp(
          `create policy ${root}_update_member on public\\.${root}\\s+for update to authenticated\\s+using \\(\\s*public\\.can_mutate_financial_resource\\(\\s*household_id, financial_scope, owner_membership_id\\s*\\)\\s*\\)\\s+with check \\(\\s*public\\.can_mutate_financial_resource\\(\\s*household_id, financial_scope, owner_membership_id\\s*\\)\\s*\\)`,
        ),
      );
    });
  }

  it("goals also gets a delete policy with the mutation helper", () => {
    expect(SQL).toMatch(
      /create policy goals_delete_member on public\.goals\s+for delete to authenticated\s+using \(\s*public\.can_mutate_financial_resource\(\s*household_id, financial_scope, owner_membership_id\s*\)\s*\)/,
    );
  });

  it("investment_holdings stays SELECT-only (no insert/update/delete policies)", () => {
    expect(SQL).toMatch(
      /create policy investment_holdings_select on public\.investment_holdings\s+for select to authenticated\s+using \(public\.active_membership_id\(household_id\) is not null\)/,
    );
    expect(SQL).not.toMatch(
      /create policy investment_holdings_(insert|update|delete)_/,
    );
  });
});

describe("14C ownership-aware RLS — inherited children", () => {
  // SELECT visibility is household-wide. Children that carry their own
  // household_id use active_membership_id(household_id) directly; children
  // without a household_id join their parent.
  const DIRECT_HOUSEHOLD_SELECT = [
    "transactions",
    "loan_payments",
    "debt_payments",
    "goal_contributions",
    "goal_funding_links",
  ];
  // Investment tables use the base policy name (no _member suffix).
  const DIRECT_HOUSEHOLD_SELECT_BASE_NAME = [
    "investment_operations",
    "investment_fees",
    "investment_valuations",
  ];
  const PARENT_JOIN_SELECT = [
    { table: "saving_cycles", parent: "savings", fk: "saving_id" },
    { table: "early_withdrawals", parent: "savings", fk: "saving_id" },
    { table: "loan_schedule_entries", parent: "loans", fk: "loan_id" },
    { table: "loan_interest_rate_periods", parent: "loans", fk: "loan_id" },
    { table: "credit_card_settings", parent: "accounts", fk: "account_id" },
    { table: "card_billing_months", parent: "accounts", fk: "card_account_id" },
    { table: "card_billing_items", parent: "accounts", fk: "card_account_id" },
    { table: "card_payments", parent: "accounts", fk: "card_account_id" },
    { table: "credit_card_installments", parent: "accounts", fk: "card_account_id" },
  ];

  for (const table of DIRECT_HOUSEHOLD_SELECT) {
    it(`${table} SELECT is any active household member via own household_id`, () => {
      expect(SQL).toMatch(
        new RegExp(
          `create policy ${table}_select_member on public\\.${table}\\s+for select to authenticated\\s+using \\(public\\.active_membership_id\\(household_id\\) is not null\\)`,
        ),
      );
    });
  }

  for (const table of DIRECT_HOUSEHOLD_SELECT_BASE_NAME) {
    it(`${table} SELECT is any active household member via own household_id`, () => {
      expect(SQL).toMatch(
        new RegExp(
          `create policy ${table}_select on public\\.${table}\\s+for select to authenticated\\s+using \\(public\\.active_membership_id\\(household_id\\) is not null\\)`,
        ),
      );
    });
  }

  for (const { table, parent, fk } of PARENT_JOIN_SELECT) {
    it(`${table} SELECT joins the parent ${parent} for household visibility`, () => {
      expect(SQL).toMatch(
        new RegExp(
          `create policy ${table}_select_member\\s+on public\\.${table}\\s+for select to authenticated\\s+using \\(\\s*exists \\(\\s*select 1 from public\\.${parent} \\w+\\s+where \\w+\\.id = ${table}\\.${fk}\\s+and public\\.active_membership_id\\(\\w+\\.household_id\\) is not null`,
        ),
      );
    });
  }

  it("card_payment_applications SELECT joins card_payments then the card account", () => {
    expect(SQL).toMatch(
      /create policy card_payment_applications_select_member\s+on public\.card_payment_applications\s+for select to authenticated\s+using \(\s*exists \(\s*select 1 from public\.card_payments cp\s+where cp\.id = card_payment_applications\.card_payment_id/,
    );
  });

  it("credit_card_installment_schedule SELECT joins installments then the card account", () => {
    expect(SQL).toMatch(
      /create policy credit_card_installment_schedule_select_member\s+on public\.credit_card_installment_schedule\s+for select to authenticated\s+using \(\s*exists \(\s*select 1 from public\.credit_card_installments ci\s+where ci\.id = credit_card_installment_schedule\.installment_id/,
    );
  });

  it("transactions INSERT/UPDATE/DELETE derive authority from the parent account", () => {
    expect(SQL).toMatch(
      /create policy transactions_insert_member on public\.transactions\s+for insert to authenticated\s+with check \(\s*exists \(\s*select 1\s+from public\.accounts a\s+where a\.id = transactions\.account_id\s+and public\.can_mutate_financial_resource\(/,
    );
    expect(SQL).toMatch(
      /create policy transactions_delete_member on public\.transactions\s+for delete to authenticated\s+using \(\s*exists \(\s*select 1\s+from public\.accounts a\s+where a\.id = transactions\.account_id\s+and public\.can_mutate_financial_resource\(/,
    );
  });

  it("saving_cycles inherits through savings", () => {
    expect(SQL).toMatch(
      /create policy saving_cycles_insert_member on public\.saving_cycles\s+for insert to authenticated\s+with check \(\s*exists \(\s*select 1 from public\.savings s\s+where s\.id = saving_cycles\.saving_id\s+and public\.can_mutate_financial_resource\(/,
    );
  });

  it("loan_payments inherits through loans", () => {
    expect(SQL).toMatch(
      /create policy loan_payments_insert_member on public\.loan_payments\s+for insert to authenticated\s+with check \(\s*exists \(\s*select 1 from public\.loans l\s+where l\.id = loan_payments\.loan_id\s+and public\.can_mutate_financial_resource\(/,
    );
  });

  it("goal_contributions inherits through goals", () => {
    expect(SQL).toMatch(
      /create policy goal_contributions_insert_member on public\.goal_contributions\s+for insert to authenticated\s+with check \(\s*exists \(\s*select 1 from public\.goals g\s+where g\.id = goal_contributions\.goal_id\s+and public\.can_mutate_financial_resource\(/,
    );
  });
});

describe("14C ownership-aware RLS — narrow Admin cleanup", () => {
  it("defines admin_archive_financial_resource as SECURITY DEFINER RPC (not a broad admin UPDATE policy)", () => {
    expect(SQL).toMatch(
      /create or replace function public\.admin_archive_financial_resource\(\s*p_resource_type text,\s*p_resource_id uuid\s*\)\s+returns jsonb\s+language plpgsql\s+security definer\s+set search_path = public/,
    );
    expect(SQL).toMatch(/not_allowed/);
    expect(SQL).toMatch(/can_admin_cleanup/);
    // Only archive-flag mutations exist inside — no balance/payment/ownership writes.
    expect(SQL).toMatch(/update public\.accounts\s+set is_archived = true\s+where id = p_resource_id/);
    expect(SQL).not.toMatch(/update public\.accounts\s+set (opening_balance|financial_scope)/);
  });

  it("grants execute to authenticated only", () => {
    expect(SQL).toMatch(
      /grant execute on function public\.admin_archive_financial_resource\(text, uuid\) to authenticated/,
    );
  });
});

describe("14C ownership-aware RLS — temporary lock removal order", () => {
  it("drops the force_household_scope triggers AFTER the replacement policies exist", () => {
    const policyIndex = SQL.indexOf("create policy accounts_select_member");
    const dropIndex = SQL.indexOf("accounts_force_household_scope_trg");
    expect(policyIndex).toBeGreaterThan(0);
    expect(dropIndex).toBeGreaterThan(policyIndex);
  });

  it("drops force_household_scope function", () => {
    expect(SQL).toMatch(/drop function if exists public\.force_household_scope\(\)/);
  });

  it("removes all five 14B lock triggers", () => {
    for (const root of ROOTS) {
      expect(SQL).toMatch(
        new RegExp(`drop trigger if exists ${root}_force_household_scope_trg on public\\.${root}`),
      );
    }
  });
});

describe("14C ownership-aware RLS — production capability stays disabled", () => {
  it("keeps ownership columns REVOKEd from authenticated (defense in depth)", () => {
    for (const root of [...ROOTS, ...SELECT_ONLY_ROOTS]) {
      expect(SQL).toMatch(
        new RegExp(`revoke insert \\(financial_scope, owner_membership_id\\) on public\\.${root} from authenticated`),
      );
      expect(SQL).toMatch(
        new RegExp(`revoke update \\(financial_scope, owner_membership_id\\) on public\\.${root} from authenticated`),
      );
    }
  });

  it("documents that the app layer (not RLS) is what keeps production household-only in 14C", () => {
    expect(SQL).toMatch(/production flows still can only create[\s\S]*?household rows/);
    expect(SQL).toMatch(/application[\s\S]*?capability remains disabled until 14D\/14E/);
  });
});

describe("14C ownership-aware RLS — Plan and Inbox untouched", () => {
  for (const table of HOUSEHOLD_ONLY_TABLES) {
    it(`${table} has no ownership-related policy or column change`, () => {
      // No drop/recreate of policies for Plan/Inbox tables in the 14C migration.
      expect(SQL).not.toMatch(
        new RegExp(`create policy ${table}_(select|insert|update|delete)`),
      );
      expect(SQL).not.toMatch(
        new RegExp(`alter table public\\.${table}\\s+add column if not exists financial_scope`),
      );
    });
  }

  it("never adds ownership columns to any child or Plan/Inbox table", () => {
    for (const table of [...INHERITED_CHILDREN.map((c) => c.table), ...HOUSEHOLD_ONLY_TABLES]) {
      expect(SQL).not.toMatch(
        new RegExp(`alter table public\\.${table}\\s+add column if not exists (financial_scope|owner_membership_id)`),
      );
    }
  });
});

describe("14C ownership-aware RLS — RPC gap matrix inputs", () => {
  it("documents that SECURITY DEFINER RPCs bypass table RLS and need 14D owner guards", () => {
    expect(SQL).toMatch(/14D adds owner guards there|SECURITY DEFINER RPCs/);
  });

  it("adds parent-join index coverage for inherited-child RLS lookups", () => {
    for (const index of [
      "idx_saving_cycles_saving",
      "idx_early_withdrawals_saving",
      "idx_loan_payments_loan",
      "idx_loan_schedule_entries_loan",
      "idx_loan_interest_rate_periods_loan",
      "idx_debt_payments_liability",
      "idx_goal_contributions_goal",
      "idx_goal_funding_links_goal",
      "idx_credit_card_settings_account",
      "idx_card_billing_months_card",
      "idx_card_billing_items_card",
      "idx_card_payments_card",
      "idx_credit_card_installments_card",
      "idx_investment_operations_holding",
      "idx_investment_valuations_holding",
    ]) {
      expect(SQL).toMatch(new RegExp(`create index if not exists ${index}`));
    }
  });
});
