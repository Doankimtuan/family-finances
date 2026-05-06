"use server";

import { cookies } from "next/headers";

import { CACHE } from "@/lib/constants";
import { LANGUAGE_COOKIE_NAME, languageToLocale, type AppLanguage } from "@/lib/i18n/config";
import { writeAuditEvent } from "@/lib/server/audit";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, revalidateSettingsProfile, revalidateSettingsHousehold, revalidateSettingsAssumptions, revalidatePath } from "@/lib/server/action-helpers";
import { resolveActionContext } from "@/lib/server/action-context";

import type { SettingsActionState } from "./action-types";

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
  const { supabase, user, householdId, t, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? t("validation.no_household"));

  const fullName = String(formData.get("fullName") ?? "").trim();
  const avatarUrlRaw = String(formData.get("avatarUrl") ?? "").trim();
  const avatarUrl = avatarUrlRaw.length > 0 ? avatarUrlRaw : null;

  if (fullName.length < 2)
    return fail(t("validation.full_name_min"));

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

  revalidateSettingsProfile();
  return ok(t("validation.profile_updated"));
}

export async function updateHouseholdSettingsAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { supabase, user, householdId, t, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? t("validation.no_household"));

  const name = String(formData.get("name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "Asia/Ho_Chi_Minh").trim() || "Asia/Ho_Chi_Minh";
  const languageRaw = String(formData.get("language") ?? "en").trim();
  const language: AppLanguage = languageRaw === "vi" ? "vi" : "en";
  const locale = languageToLocale(language);

  if (name.length < 2)
    return fail(t("validation.household_name_min"));

  const update = await supabase
    .from("households")
    .update({ name, timezone, locale, base_currency: "VND" })
    .eq("id", householdId);

  if (update.error) return fail(update.error.message);

  const cookieStore = await cookies();
  cookieStore.set(LANGUAGE_COOKIE_NAME, language, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: CACHE.COOKIE_MAX_AGE_SECONDS,
  });

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "settings.household_updated",
    entityType: "household",
    entityId: householdId,
    payload: { name, timezone, locale, baseCurrency: "VND" },
  });

  revalidateSettingsHousehold();
  return ok(t("validation.household_updated"));
}

export async function updateAssumptionsAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { supabase, user, householdId, t, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? t("validation.no_household"));

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
    return fail(t("validation.assumptions_range"));
  }

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

  revalidateSettingsAssumptions();
  return ok(t("validation.assumptions_updated"));
}

export async function updateLanguagePreferenceAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { supabase, user, householdId, t, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? t("validation.no_household"));

  const languageRaw = String(formData.get("language") ?? "en").trim();
  const language: AppLanguage = languageRaw === "vi" ? "vi" : "en";
  const locale = languageToLocale(language);

  const update = await supabase
    .from("households")
    .update({ locale })
    .eq("id", householdId);

  if (update.error) return fail(update.error.message);

  const cookieStore = await cookies();
  cookieStore.set(LANGUAGE_COOKIE_NAME, language, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: CACHE.COOKIE_MAX_AGE_SECONDS,
  });

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "settings.language_updated",
    entityType: "household",
    entityId: householdId,
    payload: { language, locale },
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/settings/household");
  revalidatePath("/settings");
  return ok(t("validation.language_updated"));
}
