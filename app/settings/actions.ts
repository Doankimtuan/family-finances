"use server";

import { cookies } from "next/headers";

import { CACHE } from "@/lib/constants";
import { LANGUAGE_COOKIE_NAME, languageToLocale, type AppLanguage } from "@/lib/i18n/config";
import { writeAuditEvent } from "@/lib/server/audit";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, resolveActionContext, revalidateSettingsProfile, revalidateSettingsHousehold, revalidateSettingsAssumptions, revalidatePath } from "@/lib/server/action-helpers";

import type { SettingsActionState } from "./action-types";

async function getLang(): Promise<AppLanguage> {
  const cookieStore = await cookies();
  return cookieStore.get(LANGUAGE_COOKIE_NAME)?.value === "vi" ? "vi" : "en";
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
  const lang = await getLang();
  const vi = lang === "vi";
  const fullName = String(formData.get("fullName") ?? "").trim();
  const avatarUrlRaw = String(formData.get("avatarUrl") ?? "").trim();
  const avatarUrl = avatarUrlRaw.length > 0 ? avatarUrlRaw : null;

  if (fullName.length < 2)
    return fail(vi ? "Họ và tên phải có ít nhất 2 ký tự." : "Full name must be at least 2 characters.");

  const { supabase, user, householdId, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? (vi ? "Không tìm thấy hộ gia đình." : "No household found."));

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
  return ok(vi ? "Đã cập nhật hồ sơ." : "Profile updated.");
}

export async function updateHouseholdSettingsAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const lang = await getLang();
  const vi = lang === "vi";
  const name = String(formData.get("name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "Asia/Ho_Chi_Minh").trim() || "Asia/Ho_Chi_Minh";
  const languageRaw = String(formData.get("language") ?? "en").trim();
  const language: AppLanguage = languageRaw === "vi" ? "vi" : "en";
  const locale = languageToLocale(language);

  if (name.length < 2)
    return fail(vi ? "Tên hộ gia đình phải có ít nhất 2 ký tự." : "Household name must be at least 2 characters.");

  const { supabase, user, householdId, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? (vi ? "Không tìm thấy hộ gia đình." : "No household found."));

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
  return ok(vi ? "Đã lưu cài đặt hộ gia đình." : "Household settings updated.");
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

  const lang = await getLang();
  const vi = lang === "vi";

  if (
    inflation === null ||
    cashReturn === null ||
    investmentReturn === null ||
    propertyGrowth === null ||
    goldGrowth === null ||
    salaryGrowth === null
  ) {
    return fail(
      vi
        ? "Tất cả các giả định phải là số phần trăm hợp lệ từ 0 đến 100."
        : "All assumptions must be valid percentages between 0 and 100.",
    );
  }

  const { supabase, user, householdId, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? (vi ? "Không tìm thấy hộ gia đình." : "No household found."));

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
  return ok(vi ? "Đã lưu giả định tài chính." : "Planning assumptions updated.");
}

export async function updateLanguagePreferenceAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const languageRaw = String(formData.get("language") ?? "en").trim();
  const language: AppLanguage = languageRaw === "vi" ? "vi" : "en";
  const locale = languageToLocale(language);
  const vi = language === "vi";

  const { supabase, user, householdId, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? (vi ? "Không tìm thấy hộ gia đình." : "No household found."));

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
  return ok(vi ? "Đã cập nhật ngôn ngữ." : "Language updated.");
}
