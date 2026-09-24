import { defineRouting } from "next-intl/routing";

export const APP_LOCALE = {
  ENGLISH: "en",
  VIETNAMESE: "vi",
} as const;

export const locales = [APP_LOCALE.ENGLISH, APP_LOCALE.VIETNAMESE] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: APP_LOCALE.ENGLISH,
  localePrefix: "always",
});
