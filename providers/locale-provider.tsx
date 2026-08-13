"use client";

import { I18nProvider } from "@heroui/react";
import type { ReactNode } from "react";

export function LocaleProvider({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  return <I18nProvider locale={locale}>{children}</I18nProvider>;
}
