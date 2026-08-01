"use client";

import { useEffect } from "react";

/** Keep `<html lang>` aligned with the active next-intl locale. */
export function SetHtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
