import type { Metadata } from "next";

import { localeToLanguage, normalizeHouseholdLocale } from "@/lib/i18n/config";
import { AppProviders } from "@/lib/providers/app-providers";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "VíNhà", template: "%s · VíNhà" },
  description: "Tài chính minh bạch — Quản lý chi tiêu, đầu tư, tài sản gia đình",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/favicon-180x180.png", sizes: "180x180" },
    shortcut: "/favicon.png",
  },
  manifest: "/manifest.json",
};

async function resolveLanguageAndLocale() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { language: "en" as const, locale: "en-US" };
    }

    const membership = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const householdId = membership.data?.household_id;
    if (!householdId) {
      return { language: "en" as const, locale: "en-US" };
    }

    const household = await supabase
      .from("households")
      .select("locale")
      .eq("id", householdId)
      .maybeSingle();

    const locale = normalizeHouseholdLocale(household.data?.locale);
    return { language: localeToLanguage(locale), locale };
  } catch {
    return { language: "en" as const, locale: "en-US" };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { language, locale } = await resolveLanguageAndLocale();

  return (
    <html lang={language === "vi" ? "vi" : "en"}>
      <body
        className="font-sans antialiased"
      >
        <AppProviders language={language} locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
