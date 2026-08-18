// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260818140000_together_membership_lifecycle_14f.sql",
  "utf8",
);
const roleEventRepairMigration = readFileSync(
  "supabase/migrations/20260818143000_together_role_event_repair_14f.sql",
  "utf8",
);

describe("Prompt 14F Together membership lifecycle", () => {
  it("keeps ownership identities and blocks hard deletion", () => {
    expect(migration).toContain("add column if not exists left_at");
    expect(migration).toContain("prevent_owned_membership_delete");
    expect(migration).toContain(
      "Membership owns financial resources and cannot be deleted",
    );
  });

  it("authorizes invitations and serializes the two-member capacity check", () => {
    expect(migration).toContain(
      "if not public.is_household_admin(v_household_id)",
    );
    expect(migration).toContain(
      "perform 1 from public.households h where h.id = v_household_id for update",
    );
    expect(migration).toContain(
      "where hm.household_id = v_invite.household_id and hm.is_active = true",
    );
  });

  it("supports idempotent revocation and rejects non-pending acceptance", () => {
    expect(migration).toContain("if v_status = 'revoked' then");
    expect(migration).toContain("if v_invite.status <> 'pending' then");
    expect(migration).toContain("set status = 'expired'");
  });

  it("deactivates members without transferring resources and clears stale Inbox assignment", () => {
    expect(migration).toContain(
      "create or replace function public.leave_household()",
    );
    expect(migration).toContain(
      "create or replace function public.remove_household_member(p_membership_id uuid)",
    );
    expect(migration).toContain("set is_active = false, left_at = now()");
    expect(migration).toContain("set assigned_to_user_id = null");
    expect(migration).toContain("Admin continuity required before leaving");
  });

  it("reactivates the same membership identity on rejoin", () => {
    expect(migration).toContain(
      "where hm.household_id = v_invite.household_id and hm.user_id = v_user_id",
    );
    expect(migration).toContain("set role = 'partner', is_active = true");
    expect(migration).toContain("owner_membership_id");
  });

  it("preserves secure role transfer and its existing audit dependency", () => {
    expect(migration).toContain(
      "Admin continuity required before changing role",
    );
    expect(roleEventRepairMigration).toContain(
      "create table if not exists public.household_configuration_events",
    );
  });
});
