"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { CACHE, TIME } from "@/lib/constants";
import { LANGUAGE_COOKIE_NAME } from "@/lib/i18n/config";
import { writeAuditEvent } from "@/lib/server/audit";
import { createClient } from "@/lib/supabase/server";

import type { HouseholdActionState } from "./action-types";

function errorState(message: string): HouseholdActionState {
  return { status: "error", message };
}

function successState(message: string): HouseholdActionState {
  return { status: "success", message };
}

export async function createHouseholdAction(
  _prevState: HouseholdActionState,
  formData: FormData,
): Promise<HouseholdActionState> {
  const householdName = String(formData.get("householdName") ?? "").trim();

  if (householdName.length < 2) {
    return errorState("Household name must be at least 2 characters.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return errorState("You must be logged in to create a household.");
  }

  const existingMembership = await supabase
    .from("household_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (existingMembership.error) {
    return errorState(existingMembership.error.message);
  }

  if (existingMembership.data?.id) {
    return errorState("You already belong to a household.");
  }

  const createResult = await supabase.rpc("create_household_with_owner", {
    p_name: householdName,
    p_base_currency: "VND",
    p_locale: "en-US",
    p_timezone: "Asia/Ho_Chi_Minh",
  });

  if (createResult.error || !createResult.data) {
    return errorState(createResult.error?.message ?? "Failed to create household.");
  }

  await writeAuditEvent(supabase, {
    householdId: createResult.data,
    actorUserId: user.id,
    eventType: "household.created",
    entityType: "household",
    entityId: createResult.data,
    payload: { name: householdName },
  });

  const cookieStore = await cookies();
  cookieStore.set(LANGUAGE_COOKIE_NAME, "en", {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: CACHE.COOKIE_MAX_AGE_SECONDS,
  });

  revalidatePath("/dashboard");
  revalidatePath("/household");

  return successState("Household created successfully.");
}

export async function inviteMemberAction(
  _prevState: HouseholdActionState,
  formData: FormData,
): Promise<HouseholdActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email.includes("@")) {
    return errorState("Enter a valid email address.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return errorState("You must be logged in to invite a member.");
  }

  const memberQuery = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (memberQuery.error || !memberQuery.data?.household_id) {
    return errorState(memberQuery.error?.message ?? "Create a household first.");
  }

  const householdId = memberQuery.data.household_id;

  const profileLookup = await supabase
    .from("profiles")
    .select("user_id")
    .eq("email", email)
    .maybeSingle();

  if (profileLookup.error) {
    return errorState(profileLookup.error.message);
  }

  if (profileLookup.data?.user_id) {
    const existingMember = await supabase
      .from("household_members")
      .select("id")
      .eq("household_id", householdId)
      .eq("is_active", true)
      .eq("user_id", profileLookup.data.user_id)
      .limit(1)
      .maybeSingle();

    if (existingMember.error) {
      return errorState(existingMember.error.message);
    }

    if (existingMember.data?.id) {
      return errorState("This user is already a household member.");
    }
  }

  const inviteInsert = await supabase
    .from("household_invitations")
    .insert({
      household_id: householdId,
      email,
      invited_by: user.id,
      status: "pending",
      expires_at: new Date(Date.now() + TIME.MS_PER_WEEK).toISOString(),
    })
    .select("token")
    .single();

  if (inviteInsert.error || !inviteInsert.data?.token) {
    return errorState(inviteInsert.error?.message ?? "Failed to create invitation.");
  }

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "household.invite_created",
    entityType: "household_invitation",
    payload: { email },
  });

  revalidatePath("/household");

  return successState(`Invitation created. Share token: ${inviteInsert.data.token}`);
}

export async function acceptInviteAction(
  _prevState: HouseholdActionState,
  formData: FormData,
): Promise<HouseholdActionState> {
  const token = String(formData.get("token") ?? "").trim();

  if (token.length === 0) {
    return errorState("Invitation token is required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return errorState("You must be logged in with a verified email.");
  }

  const inviteQuery = await supabase
    .from("household_invitations")
    .select("id, household_id, invited_by, status, expires_at, email")
    .eq("token", token)
    .maybeSingle();

  if (inviteQuery.error || !inviteQuery.data) {
    return errorState(inviteQuery.error?.message ?? "Invitation not found.");
  }

  const invite = inviteQuery.data;

  if (invite.status !== "pending") {
    return errorState("This invitation is no longer pending.");
  }

  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    return errorState("This invitation has expired.");
  }

  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return errorState("This invitation is for a different email address.");
  }

  const insertMembership = await supabase.from("household_members").insert({
    household_id: invite.household_id,
    user_id: user.id,
    role: "partner",
    is_active: true,
    invited_by: invite.invited_by,
  });

  if (insertMembership.error && insertMembership.error.code !== "23505") {
    return errorState(insertMembership.error.message);
  }

  const updateInvite = await supabase
    .from("household_invitations")
    .update({ status: "accepted", accepted_by: user.id })
    .eq("id", invite.id)
    .eq("status", "pending");

  if (updateInvite.error) {
    return errorState(updateInvite.error.message);
  }

  await writeAuditEvent(supabase, {
    householdId: invite.household_id,
    actorUserId: user.id,
    eventType: "household.invite_accepted",
    entityType: "household_invitation",
    entityId: invite.id,
    payload: { invitedBy: invite.invited_by, email: invite.email },
  });

  revalidatePath("/dashboard");
  revalidatePath("/household");

  return successState("Invitation accepted. You now have equal partner access.");
}
