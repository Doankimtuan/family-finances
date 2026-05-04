import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { LanguageSwitcher } from "@/app/settings/_components/language-switcher";
import { User, Home, Users, Tag, TrendingUp, ChevronRight, Settings2, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Settings | Family Finances",
};

const sections = [
  {
    href: "/settings/profile",
    titleKey: "settings.profile",
    icon: User,
    color: "bg-primary/10 text-primary",
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
    color: "bg-amber-100 text-amber-600",
    description: {
      en: "Control income and expense category taxonomy.",
      vi: "Quản lý hệ thống danh mục thu nhập và chi tiêu.",
    },
  },
  {
    href: "/settings/cash-flow",
    titleKey: "settings.cash_flow",
    icon: ArrowLeftRight,
    color: "bg-cyan-100 text-cyan-600",
    description: {
      en: "Configure monthly income and expense baselines for planning.",
      vi: "Thiết lập mức thu nhập và chi tiêu cơ bản hàng tháng cho kế hoạch.",
    },
  },
  {
    href: "/settings/assumptions",
    titleKey: "settings.assumptions",
    icon: TrendingUp,
    color: "bg-blue-100 text-blue-600",
    description: {
      en: "Set inflation and return assumptions used in projections.",
      vi: "Thiết lập các giả định lạm phát và lợi suất cho dự báo.",
    },
  },
];

export default async function SettingsIndexPage() {
  const { language } = await getAuthenticatedHouseholdContext();
  const vi = language === "vi";

  return (
    <AppShell
      header={<AppHeader title={t(language, "settings.title")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="p-5 border-b border-primary/10 flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                  {vi ? "Quản lý hệ thống" : "System Management"}
                </Label>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {vi
                    ? "Tùy chỉnh trải nghiệm tài khoản của bạn."
                    : "Customize your account experience."}
                </p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {vi
                  ? "Giữ các cài đặt này luôn cập nhật để bảng điều khiển, dự báo và cộng tác luôn chính xác cho cả hai thành viên."
                  : "Keep these settings current so dashboards, projections, and collaboration stay accurate for both partners."}
              </p>
              <div className="pt-4 border-t border-slate-100">
                <LanguageSwitcher defaultLanguage={language} />
              </div>
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
                <Card className="transition-all hover:border-primary/30 hover:shadow-md border-slate-200 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105",
                        section.color,
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-slate-900">
                        {t(language, section.titleKey)}
                      </p>
                      <p className="text-xs text-slate-500 truncate font-medium mt-0.5">
                        {section.description[language]}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
