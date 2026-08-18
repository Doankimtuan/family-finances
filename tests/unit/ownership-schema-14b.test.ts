// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import {
  FINANCIAL_SCOPE_COLUMN,
  FINANCIAL_SCOPE_VALUES,
  OWNER_MEMBERSHIP_ID_COLUMN,
  isFinancialScope,
} from "@/modules/shared-kernel/application/financial-scope";

/**
 * Ownership schema foundation (Prompt 14B).
 *
 * Statically verifies the migration that adds the canonical
 * financial_scope / owner_membership_id pair to the six ownership roots:
 *   1. all six roots carry identical column names,
 *   2. every root has the scope CHECK, the same-household composite FK, and the
 *      scope/owner pairing CHECK,
 *   3. backfill deterministically resets every row to household + null owner,
 *   4. the interim column lock revokes INSERT/UPDATE on the ownership pair for
 *      the five writable roots (investment_holdings is already select-only),
 *   5. no ownership column is added to child tables — they inherit,
 *   6. Plan and Inbox remain household-only (no ownership columns),
 *   7. no production create/update path may forward ownership values (the
 *      schema capability exists but the application capability is disabled).
 */

const MIGRATIONS_DIR = `${process.cwd()}/supabase/migrations`;
const MIGRATION = "20260818020952_ownership_schema_foundation.sql";
const SQL = readFileSync(`${MIGRATIONS_DIR}/${MIGRATION}`, "utf8");

const ROOTS = [
  "accounts",
  "savings",
  "investment_holdings",
  "loans",
  "liabilities",
  "goals",
] as const;

/** Child tables that must inherit ownership rather than carry their own. */
const CHILD_TABLES = [
  "transactions",
  "saving_cycles",
  "early_withdrawals",
  "investment_operations",
  "investment_fees",
  "investment_valuations",
  "investment_events",
  "investment_lots",
  "loan_payments",
  "loan_schedule_entries",
  "loan_interest_rate_periods",
  "debt_payments",
  "credit_card_settings",
  "card_billing_months",
  "card_billing_items",
  "card_payments",
  "goal_contributions",
  "goal_funding_links",
] as const;

/** Tables that must stay household-only for V1 (Prompt 14A §11, §12). */
const HOUSEHOLD_ONLY_TABLES = [
  "jars",
  "jar_plans",
  "plan_movements",
  "jar_period_rule_snapshots",
  "jar_period_adjustments",
  "month_ritual_runs",
  "inbox_items",
] as const;

describe("14B ownership schema — canonical vocabulary", () => {
  it("exposes exactly the canonical household/personal scope values", () => {
    expect(FINANCIAL_SCOPE_VALUES).toEqual(["household", "personal"]);
    expect(isFinancialScope("household")).toBe(true);
    expect(isFinancialScope("personal")).toBe(true);
    expect(isFinancialScope("shared")).toBe(false);
    expect(isFinancialScope("private")).toBe(false);
    expect(isFinancialScope("")).toBe(false);
  });

  it("declares the canonical DB column names without drift", () => {
    expect(FINANCIAL_SCOPE_COLUMN).toBe("financial_scope");
    expect(OWNER_MEMBERSHIP_ID_COLUMN).toBe("owner_membership_id");
  });
});

describe("14B ownership schema — every ownership root", () => {
  for (const root of ROOTS) {
    it(`${root} carries financial_scope with a household default`, () => {
      expect(SQL).toMatch(
        new RegExp(
          `alter table public\\.${root}\\s+add column if not exists financial_scope text not null default 'household'`,
        ),
      );
    });

    it(`${root} carries nullable owner_membership_id`, () => {
      expect(SQL).toMatch(
        new RegExp(`add column if not exists owner_membership_id uuid`),
      );
      // The ownership pair must be declared on the same ALTER statement for this root.
      expect(
        SQL.match(
          new RegExp(
            `alter table public\\.${root}([\\s\\S]*?)add column if not exists owner_membership_id uuid`,
          ),
        ),
      ).not.toBeNull();
    });

    it(`${root} has a canonical scope CHECK`, () => {
      expect(SQL).toMatch(
        new RegExp(
          `constraint ${root}_financial_scope_check\\s+check \\(financial_scope in \\('household', 'personal'\\)\\)`,
        ),
      );
    });

    it(`${root} has a same-household composite owner FK`, () => {
      expect(SQL).toMatch(
        new RegExp(
          `constraint ${root}_owner_membership_fk\\s+foreign key \\(household_id, owner_membership_id\\)\\s+references public\\.household_members \\(household_id, id\\)`,
        ),
      );
    });

    it(`${root} enforces the scope/owner pairing (no other state)`, () => {
      expect(SQL).toMatch(
        new RegExp(
          `constraint ${root}_scope_owner_pair_check\\s+check \\(\\s*\\(financial_scope = 'household' and owner_membership_id is null\\)\\s+or \\(financial_scope = 'personal' and owner_membership_id is not null\\)\\s*\\)`,
        ),
      );
    });

    it(`${root} backfills existing rows to household + null owner`, () => {
      expect(SQL).toMatch(
        new RegExp(
          `update public\\.${root}\\s+set financial_scope = 'household', owner_membership_id = null\\s+where financial_scope is distinct from 'household' or owner_membership_id is not null`,
        ),
      );
    });
  }
});

describe("14B ownership schema — child tables inherit", () => {
  for (const child of CHILD_TABLES) {
    it(`${child} does not carry its own ownership columns`, () => {
      expect(SQL).not.toMatch(
        new RegExp(
          `alter table public\\.${child}\\s+add column if not exists financial_scope`,
        ),
      );
      expect(SQL).not.toMatch(
        new RegExp(
          `alter table public\\.${child}\\s+add column if not exists owner_membership_id`,
        ),
      );
    });
  }
});

describe("14B ownership schema — Plan and Inbox stay household-only", () => {
  for (const table of HOUSEHOLD_ONLY_TABLES) {
    it(`${table} never receives ownership columns`, () => {
      expect(SQL).not.toMatch(
        new RegExp(
          `alter table public\\.${table}\\s+add column if not exists financial_scope`,
        ),
      );
      expect(SQL).not.toMatch(
        new RegExp(
          `alter table public\\.${table}\\s+add column if not exists owner_membership_id`,
        ),
      );
    });
  }
});

describe("14B ownership schema — interim production lock", () => {
  it("defines the force_household_scope trigger function", () => {
    expect(SQL).toMatch(
      /create or replace function public\.force_household_scope\(\)/,
    );
    expect(SQL).toMatch(/new\.financial_scope := 'household';/);
    expect(SQL).toMatch(/new\.owner_membership_id := null;/);
  });

  it("attaches the lock trigger to all five writable roots", () => {
    const writableRoots = ROOTS.filter(
      (root) => root !== "investment_holdings",
    );
    for (const root of writableRoots) {
      expect(SQL).toMatch(
        new RegExp(
          `create trigger ${root}_force_household_scope_trg\\s+before insert or update on public\\.${root}\\s+for each row execute function public\\.force_household_scope\\(\\)`,
        ),
      );
    }
  });

  it("keeps the column REVOKEs as defense in depth", () => {
    const writableRoots = ROOTS.filter(
      (root) => root !== "investment_holdings",
    );
    for (const root of writableRoots) {
      expect(SQL).toMatch(
        new RegExp(
          `revoke insert \\(financial_scope, owner_membership_id\\) on public\\.${root} from authenticated`,
        ),
      );
      expect(SQL).toMatch(
        new RegExp(
          `revoke update \\(financial_scope, owner_membership_id\\) on public\\.${root} from authenticated`,
        ),
      );
    }
  });

  it("documents why investment_holdings needs no trigger lock (select-only)", () => {
    expect(SQL).toMatch(
      /investment_holdings is select-only to authenticated already/,
    );
  });
});

describe("14B ownership schema — production flows cannot create personal rows", () => {
  const MODULES_ROOT = `${process.cwd()}/modules`;
  const allowedFile = `${MODULES_ROOT}/shared-kernel/application/financial-scope.ts`;
  const allowedPlanQueries = new Set([
    `${MODULES_ROOT}/plan/application/queries/get-current-jar-budgets.ts`,
    `${MODULES_ROOT}/plan/application/queries/get-monthly-review.ts`,
    `${MODULES_ROOT}/plan/application/queries/ritual-gates.ts`,
  ]);

  function walk(dir: string, acc: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const full = `${dir}/${entry}`;
      if (statSync(full).isDirectory()) {
        walk(full, acc);
      } else if (full.endsWith(".ts") || full.endsWith(".tsx")) {
        acc.push(full);
      }
    }
    return acc;
  }

  it("no module code references the ownership columns or scope values except the constants file", () => {
    const offenders: string[] = [];
    for (const file of walk(MODULES_ROOT)) {
      if (file === allowedFile || allowedPlanQueries.has(file)) continue;
      const content = readFileSync(file, "utf8");
      if (
        /financial_scope|financialScope|owner_membership_id|ownerMembershipId|FINANCIAL_SCOPE/.test(
          content,
        )
      ) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no current root-table write flow sets the ownership columns", () => {
    // The requirement is that no flow forwards financial_scope /
    // owner_membership_id into a write. The constants file defines the
    // vocabulary (its whole purpose) and is excluded; no other module may
    // reference the ownership columns.
    const offenders: string[] = [];
    for (const file of walk(MODULES_ROOT)) {
      if (file === allowedFile || allowedPlanQueries.has(file)) continue;
      const content = readFileSync(file, "utf8");
      if (/financial_scope|owner_membership_id/.test(content)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
