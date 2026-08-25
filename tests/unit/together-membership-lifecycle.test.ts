// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260825125516_v1_baseline.sql",
  "utf8",
);

describe("Together membership lifecycle", () => {
  it("keeps ownership identities and blocks hard deletion", () => {
    expect(migration).toContain('"left_at" timestamp with time zone');
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
    expect(migration.match(/v_member_count >= 10/g)).toHaveLength(2);
  });

  it("does not let expired pending invitations block a re-invite", () => {
    expect(migration).toContain("set status = 'expired', updated_at = now()");
    expect(migration).toContain("and i.expires_at <= now()");
    expect(migration).toContain("and i.expires_at > now()");
    expect(migration).toContain("raise exception 'Invite already pending'");
  });

  it("deactivates members without transferring resources", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.leave_household()",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.remove_household_member(p_membership_id uuid)",
    );
    expect(migration).toContain("set is_active = false, left_at = now()");
    expect(migration).toContain("set assigned_to_user_id = null");
    expect(migration).toContain("Admin continuity required before leaving");
  });

  it("preserves secure role transfer and its audit dependency", () => {
    expect(migration).toContain(
      "Admin continuity required before changing role",
    );
    expect(migration).toContain(
      'create table "public"."household_configuration_events"',
    );
    expect(migration).toContain("owner_membership_id");
  });
});
