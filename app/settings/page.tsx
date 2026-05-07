import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    descriptionKey: "settings.profile_description_main",
    icon: User,
    color: "bg-primary/10 text-primary",
  },
  {
    href: "/settings/household",
    titleKey: "settings.household",
    descriptionKey: "settings.household_description_main",
    icon: Home,
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    href: "/settings/members",
    titleKey: "settings.members",
    descriptionKey: "settings.members_description_main",
    icon: Users,
    color: "bg-violet-100 text-violet-600",
  },
  {
    href: "/settings/categories",
    titleKey: "settings.categories",
    descriptionKey: "settings.categories_description_main",
    icon: Tag,
    color: "bg-amber-100 text-amber-600",
  },
  {
    href: "/settings/cash-flow",
    titleKey: "settings.cash_flow",
    descriptionKey: "settings.cash_flow_description_main",
    icon: ArrowLeftRight,
    color: "bg-cyan-100 text-cyan-600",
  },
  {
    href: "/settings/assumptions",
    titleKey: "settings.assumptions",
    descriptionKey: "settings.assumptions_description_main",
    icon: TrendingUp,
    color: "bg-blue-100 text-blue-600",
  },
];

export default async function SettingsIndexPage() {
  const { language } = await getAuthenticatedHouseholdContext();

  return (
    <AppShell
      header={<AppHeader title={t(language, "settings.title")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
          <CardHeader className="space-y-4 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                <Settings2 className="h-6 w-6" />
              </div>
              <div className="min-w-0 space-y-1">
                <Label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                  {t(language, "settings.system_management")}
                </Label>
                <CardTitle className="text-2xl leading-tight text-balance sm:text-3xl">
                  {t(language, "settings.title")}
                </CardTitle>
                <CardDescription className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                  {t(language, "settings.customize_experience")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="grid gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-5">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  {t(language, "settings.system_management")}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t(language, "settings.keep_current")}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-3 shadow-sm sm:min-w-[240px]">
                <LanguageSwitcher defaultLanguage={language} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`${t(language, section.titleKey)} - ${t(language, section.descriptionKey)}`}
              >
                <Card className="h-full border-border/70 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                  <CardContent className="flex h-full items-center gap-4 p-4 sm:p-5">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105",
                        section.color,
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-base font-semibold tracking-tight text-foreground sm:text-[17px]">
                        {t(language, section.titleKey)}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {t(language, section.descriptionKey)}
                      </p>
                    </div>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <ChevronRight className="h-4 w-4" />
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
