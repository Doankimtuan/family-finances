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
const capacityMigration = readFileSync(
  "supabase/migrations/20260824102100_together_household_member_capacity_10.sql",
  "utf8",
);
const expiryReinviteMigration = readFileSync(
  "supabase/migrations/20260824115133_together_invitation_expiry_reinvite_fix.sql",
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

  it("authorizes invitations and serializes the household capacity check", () => {
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

  it("raises a ten-member capacity guard in both invitation paths", () => {
    expect(capacityMigration.match(/v_member_count >= 10/g)).toHaveLength(2);
    expect(
      capacityMigration.match(/raise exception 'Household is full'/g),
    ).toHaveLength(2);
    expect(capacityMigration).not.toContain(
      "Household already has two partners",
    );
  });

  it("does not let expired pending invitations block a re-invite", () => {
    expect(expiryReinviteMigration).toContain(
      "set status = 'expired', updated_at = now()",
    );
    expect(expiryReinviteMigration).toContain("and i.expires_at <= now()");
    expect(expiryReinviteMigration).toContain("and i.expires_at > now()");
    expect(expiryReinviteMigration).toContain(
      "raise exception 'Invite already pending'",
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
