// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

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

describe("Ownership RLS baseline", () => {
  it("pins the ownership helpers and cleanup RPC", () => {
    for (const fn of [
      "active_membership_id",
      "can_mutate_financial_resource",
      "is_resource_owner",
      "can_admin_cleanup",
      "guard_ownership_immutable",
      "admin_archive_financial_resource",
    ]) {
      const functionBlock =
        BASELINE.match(
          new RegExp(
            `create or replace function public\\.${fn}\\([\\s\\S]*?\\$function\\$`,
            "i",
          ),
        )?.[0] ?? "";
      expect(functionBlock).toMatch(/security definer/i);
      expect(functionBlock).toMatch(/set search_path to 'public'/i);
    }
    expect(BASELINE).toContain("can_mutate_financial_resource");
    expect(BASELINE).toContain("can_admin_cleanup");
  });

  it("enables RLS and ownership immutability on the roots", () => {
    for (const root of OWNERSHIP_ROOTS) {
      expect(BASELINE).toContain(
        `alter table "public"."${root}" enable row level security`,
      );
      if (root === "investment_holdings") {
        expect(BASELINE).toContain("investment_holdings_select");
        return;
      }
      expect(BASELINE).toContain(`${root}_select_member`);
      expect(BASELINE).toContain(`${root}_update_member`);
    }
    expect(BASELINE).toContain("guard_ownership_immutable_trg");
    expect(BASELINE).toContain("Ownership is immutable");
  });

  it("keeps investment holdings select-only and grants RPC execution to authenticated", () => {
    expect(BASELINE).toContain("investment_holdings_select");
    expect(BASELINE).not.toMatch(
      /create policy investment_holdings_(insert|update|delete)/,
    );
    expect(BASELINE).toMatch(
      /grant execute on function public\.active_membership_id/i,
    );
    expect(BASELINE).toMatch(
      /grant execute on function public\.admin_archive_financial_resource/i,
    );
  });
});
