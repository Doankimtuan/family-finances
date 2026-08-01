import type { AppLocale } from "./routing";
import { locales, routing } from "./routing";

export { locales, routing };
export type { AppLocale };

/** BCP-47 tags for Intl formatters */
const INTL_LOCALE: Record<AppLocale, string> = {
  en: "en-US",
  vi: "vi-VN",
};

export function toIntlLocale(locale: string): string {
  if ((locales as readonly string[]).includes(locale)) {
    return INTL_LOCALE[locale as AppLocale];
  }
  return INTL_LOCALE[routing.defaultLocale];
}

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

/** `settings` namespace keys for each app locale label */
export const LOCALE_LABEL_KEY: Record<AppLocale, "english" | "vietnamese"> = {
  en: "english",
  vi: "vietnamese",
};
