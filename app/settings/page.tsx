import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { LanguageSwitcher } from "@/app/settings/_components/language-switcher";

export const metadata = {
  title: "Settings | Family Finances",
};

const sections = [
  {
    href: "/settings/profile",
    titleKey: "settings.profile",
    description: {
      en: "Update your name and account identity details.",
      vi: "Cập nhật tên và thông tin nhận diện tài khoản.",
    },
  },
  {
    href: "/settings/household",
    titleKey: "settings.household",
    description: {
      en: "Manage shared household identity, language, and timezone.",
      vi: "Quản lý thông tin hộ gia đình, ngôn ngữ và múi giờ.",
    },
  },
  {
    href: "/settings/categories",
    titleKey: "settings.categories",
    description: {
      en: "Control income and expense category taxonomy.",
      vi: "Quản lý hệ thống danh mục thu nhập và chi tiêu.",
    },
  },
  {
    href: "/settings/assumptions",
    titleKey: "settings.assumptions",
    description: {
      en: "Set inflation and return assumptions used in projections.",
      vi: "Thiết lập các giả định lạm phát và lợi suất cho dự báo.",
    },
  },
];

export default async function SettingsIndexPage() {
  const { language } = await getAuthenticatedHouseholdContext();

  return (
    <AppShell header={<AppHeader title={t(language, "settings.title")} />} footer={<BottomTabBar />}>
      <section className="space-y-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">
            {language === "vi"
              ? "Giữ các cài đặt này luôn cập nhật để bảng điều khiển, dự báo và cộng tác luôn chính xác cho cả hai thành viên."
              : "Keep these settings current so dashboards, projections, and collaboration stay accurate for both partners."}
          </p>
          <div className="mt-4 border-t border-slate-200 pt-4">
            <LanguageSwitcher defaultLanguage={language} />
          </div>
        </article>

        <div className="grid grid-cols-1 gap-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300"
            >
              <p className="text-base font-semibold text-slate-900">{t(language, section.titleKey)}</p>
              <p className="mt-1 text-sm text-slate-600">{section.description[language]}</p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
