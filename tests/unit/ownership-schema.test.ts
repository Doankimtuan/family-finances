// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  FINANCIAL_SCOPE_COLUMN,
  FINANCIAL_SCOPE_VALUES,
  OWNER_MEMBERSHIP_ID_COLUMN,
  isFinancialScope,
} from "@/modules/shared-kernel/application/financial-scope";

const BASELINE = readFileSync(
  "supabase/migrations/20260825125516_v1_baseline.sql",
  "utf8",
);
const OWNERSHIP_ROOTS = [
  "accounts",
  "savings",
  "investment_holdings",
  "loans",
  "liabilities",
  "goals",
] as const;

describe("Ownership schema baseline", () => {
  it("exposes the canonical scope vocabulary", () => {
    expect(FINANCIAL_SCOPE_VALUES).toEqual(["household", "personal"]);
    expect(FINANCIAL_SCOPE_COLUMN).toBe("financial_scope");
    expect(OWNER_MEMBERSHIP_ID_COLUMN).toBe("owner_membership_id");
    expect(isFinancialScope("household")).toBe(true);
    expect(isFinancialScope("personal")).toBe(true);
    expect(isFinancialScope("shared")).toBe(false);
  });

  for (const root of OWNERSHIP_ROOTS) {
    it(`${root} carries the ownership pair and constraints`, () => {
      expect(BASELINE).toMatch(new RegExp(`create table "public"\."${root}"`));
      expect(BASELINE).toMatch(
        new RegExp(`"${root}"[\\s\\S]*"financial_scope" text`),
      );
      expect(BASELINE).toMatch(
        new RegExp(`"${root}"[\\s\\S]*"owner_membership_id" uuid`),
      );
      expect(BASELINE).toContain(`${root}_financial_scope_check`);
      expect(BASELINE).toContain(`${root}_owner_membership_fk`);
      expect(BASELINE).toContain(`${root}_scope_owner_pair_check`);
    });
  }

  it("does not add ownership columns to inherited child tables", () => {
    for (const table of [
      "transactions",
      "saving_cycles",
      "loan_payments",
      "debt_payments",
      "goal_contributions",
      "inbox_items",
    ]) {
      const tableBlock =
        BASELINE.match(
          new RegExp(`create table "public"\."${table}"[\\s\\S]*?\\n\\);`),
        )?.[0] ?? "";
      expect(tableBlock).not.toContain('"financial_scope"');
      expect(tableBlock).not.toContain('"owner_membership_id"');
    }
  });
});
