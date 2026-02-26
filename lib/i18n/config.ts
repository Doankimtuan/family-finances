export type AppLanguage = "en" | "vi";

export const LANGUAGE_COOKIE_NAME = "ff_lang";

export function normalizeHouseholdLocale(locale: string | null | undefined) {
  if (!locale) return "en-US";
  const normalized = locale.trim().toLowerCase();
  if (normalized.startsWith("vi")) return "vi-VN";
  if (normalized.startsWith("en")) return "en-US";
  return "en-US";
}

export function localeToLanguage(locale: string | null | undefined): AppLanguage {
  return normalizeHouseholdLocale(locale).startsWith("vi") ? "vi" : "en";
}

export function languageToLocale(language: AppLanguage) {
  return language === "vi" ? "vi-VN" : "en-US";
}
