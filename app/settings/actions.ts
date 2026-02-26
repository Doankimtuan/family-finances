"use server";

import { revalidatePath } from "next/cache";

import { writeAuditEvent } from "@/lib/server/audit";
import { createClient } from "@/lib/supabase/server";

import type { SettingsActionState } from "./action-types";

function ok(message: string): SettingsActionState {
  return { status: "success", message };
}

function fail(message: string): SettingsActionState {
  return { status: "error", message };
}

async function resolveContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, householdId: null, error: "You must be logged in." };
  }

  const membership = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership.error || !membership.data?.household_id) {
    return { supabase, user, householdId: null, error: membership.error?.message ?? "No household found." };
  }

  return { supabase, user, householdId: membership.data.household_id, error: null };
}

function parsePercent(input: FormDataEntryValue | null): number | null {
  const raw = Number(input ?? NaN);
  if (!Number.isFinite(raw) || raw < 0 || raw > 100) {
    return null;
  }
  return raw / 100;
}

export async function updateProfileAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const avatarUrlRaw = String(formData.get("avatarUrl") ?? "").trim();
  const avatarUrl = avatarUrlRaw.length > 0 ? avatarUrlRaw : null;

  if (fullName.length < 2) return fail("Full name must be at least 2 characters.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  const update = await supabase
    .from("profiles")
    .update({ full_name: fullName, avatar_url: avatarUrl })
    .eq("user_id", user.id);

  if (update.error) return fail(update.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "settings.profile_updated",
    entityType: "profile",
    entityId: user.id,
    payload: { fullName, hasAvatarUrl: Boolean(avatarUrl) },
  });

  revalidatePath("/settings");
  revalidatePath("/settings/profile");
  return ok("Profile updated.");
}

export async function updateHouseholdSettingsAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "Asia/Ho_Chi_Minh").trim() || "Asia/Ho_Chi_Minh";
  const locale = String(formData.get("locale") ?? "en-VN").trim() || "en-VN";

  if (name.length < 2) return fail("Household name must be at least 2 characters.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  const update = await supabase
    .from("households")
    .update({ name, timezone, locale, base_currency: "VND" })
    .eq("id", householdId);

  if (update.error) return fail(update.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "settings.household_updated",
    entityType: "household",
    entityId: householdId,
    payload: { name, timezone, locale, baseCurrency: "VND" },
  });

  revalidatePath("/settings");
  revalidatePath("/settings/household");
  revalidatePath("/household");
  return ok("Household settings updated.");
}

export async function updateAssumptionsAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const inflation = parsePercent(formData.get("inflationAnnual"));
  const cashReturn = parsePercent(formData.get("cashReturnAnnual"));
  const investmentReturn = parsePercent(formData.get("investmentReturnAnnual"));
  const propertyGrowth = parsePercent(formData.get("propertyGrowthAnnual"));
  const goldGrowth = parsePercent(formData.get("goldGrowthAnnual"));
  const salaryGrowth = parsePercent(formData.get("salaryGrowthAnnual"));

  if (
    inflation === null ||
    cashReturn === null ||
    investmentReturn === null ||
    propertyGrowth === null ||
    goldGrowth === null ||
    salaryGrowth === null
  ) {
    return fail("All assumptions must be valid percentages between 0 and 100.");
  }

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  const update = await supabase
    .from("households")
    .update({
      assumptions_inflation_annual: inflation,
      assumptions_cash_return_annual: cashReturn,
      assumptions_investment_return_annual: investmentReturn,
      assumptions_property_growth_annual: propertyGrowth,
      assumptions_gold_growth_annual: goldGrowth,
      assumptions_salary_growth_annual: salaryGrowth,
    })
    .eq("id", householdId);

  if (update.error) return fail(update.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "settings.assumptions_updated",
    entityType: "household",
    entityId: householdId,
    payload: {
      inflation,
      cashReturn,
      investmentReturn,
      propertyGrowth,
      goldGrowth,
      salaryGrowth,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/settings/assumptions");
  revalidatePath("/dashboard");
  revalidatePath("/decision-tools");
  return ok("Planning assumptions updated.");
}
