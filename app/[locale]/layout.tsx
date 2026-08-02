import type { ReactNode } from "react";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";
import { AppProvider } from "@/providers/app-provider";
import { routing } from "@/i18n/routing";
import { SetHtmlLang } from "./set-html-lang";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  // Brand accent (Cradle & Seed / Calm Ledger teal) — see artifacts/branding/CURRENT/color-system.md
  themeColor: "#0F766E",
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppProvider>
        {/* Sync document language for a11y without nesting <html> */}
        <LocaleLang locale={locale}>{children}</LocaleLang>
      </AppProvider>
    </NextIntlClientProvider>
  );
}

/** Sets `document.documentElement.lang` on the client; SSR uses root `lang="en"` then hydrates. */
function LocaleLang({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  return (
    <div lang={locale} className="contents">
      <SetHtmlLang locale={locale} />
      {children}
    </div>
  );
}
