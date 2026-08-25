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
import { LocaleProvider } from "@/providers/locale-provider";

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
  // Family Finance brand accent remains the existing semantic teal token.
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
      <LocaleProvider locale={locale}>
        <AppProvider>
          {/* Sync document language for a11y without adding a DOM wrapper. */}
          <SetHtmlLang locale={locale} />
          {children}
        </AppProvider>
      </LocaleProvider>
    </NextIntlClientProvider>
  );
}
