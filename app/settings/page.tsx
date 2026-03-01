import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { LanguageSwitcher } from "@/app/settings/_components/language-switcher";
import { User, Home, Users, Tag, TrendingUp, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Settings | Family Finances",
};

const sections = [
  {
    href: "/settings/profile",
    titleKey: "settings.profile",
    icon: User,
    color: "bg-blue-100 text-blue-600",
    description: {
      en: "Update your name and account identity details.",
      vi: "Cập nhật tên và thông tin nhận diện tài khoản.",
    },
  },
  {
    href: "/settings/household",
    titleKey: "settings.household",
    icon: Home,
    color: "bg-emerald-100 text-emerald-600",
    description: {
      en: "Manage shared household identity, language, and timezone.",
      vi: "Quản lý thông tin hộ gia đình, ngôn ngữ và múi giờ.",
    },
  },
  {
    href: "/settings/members",
    titleKey: "settings.members",
    icon: Users,
    color: "bg-violet-100 text-violet-600",
    description: {
      en: "Invite partner and manage household members.",
      vi: "Mời bạn đời và quản lý thành viên hộ gia đình.",
    },
  },
  {
    href: "/settings/categories",
    titleKey: "settings.categories",
    icon: Tag,
    color: "bg-orange-100 text-orange-600",
    description: {
      en: "Control income and expense category taxonomy.",
      vi: "Quản lý hệ thống danh mục thu nhập và chi tiêu.",
    },
  },
  {
    href: "/settings/assumptions",
    titleKey: "settings.assumptions",
    icon: TrendingUp,
    color: "bg-teal-100 text-teal-600",
    description: {
      en: "Set inflation and return assumptions used in projections.",
      vi: "Thiết lập các giả định lạm phát và lợi suất cho dự báo.",
    },
  },
];

export default async function SettingsIndexPage() {
  const { language } = await getAuthenticatedHouseholdContext();

  return (
    <AppShell
      header={<AppHeader title={t(language, "settings.title")} />}
      footer={<BottomTabBar />}
    >
      <section className="space-y-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">
              {language === "vi"
                ? "Giữ các cài đặt này luôn cập nhật để bảng điều khiển, dự báo và cộng tác luôn chính xác cho cả hai thành viên."
                : "Keep these settings current so dashboards, projections, and collaboration stay accurate for both partners."}
            </p>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <LanguageSwitcher defaultLanguage={language} />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="block group"
              >
                <Card className="transition-all hover:border-primary/50 hover:shadow-md">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        section.color,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {t(language, section.titleKey)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {section.description[language]}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
