"use client";

import { createContext, useContext } from "react";

import type { AppLanguage } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/dictionary";

type I18nContextValue = {
  language: AppLanguage;
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue>({
  language: "en",
  locale: "en-US",
  t: (key) => key,
});

export function I18nProvider({
  children,
  language,
  locale,
}: {
  children: React.ReactNode;
  language: AppLanguage;
  locale: string;
}) {
  return (
    <I18nContext.Provider
      value={{
        language,
        locale,
        t: (key: string, params?: Record<string, string | number>) =>
          t(language, key, params),
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
