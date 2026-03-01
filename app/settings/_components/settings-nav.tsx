"use client";

import Link from "next/link";

import { useI18n } from "@/lib/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { User, Home, Users, Tag, TrendingUp } from "lucide-react";

const links = [
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/household", label: "Household", icon: Home },
  { href: "/settings/members", label: "Members", icon: Users },
  { href: "/settings/categories", label: "Categories", icon: Tag },
  { href: "/settings/assumptions", label: "Assumptions", icon: TrendingUp },
];

export function SettingsNav({ currentPath }: { currentPath: string }) {
  const { t } = useI18n();

  const labelMap: Record<string, string> = {
    Profile: "settings.profile",
    Household: "settings.household",
    Members: "settings.members",
    Categories: "settings.categories",
    Assumptions: "settings.assumptions",
  };

  return (
    <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
      <CardContent className="p-0 sm:p-2">
        <nav className="flex overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-5 gap-2 no-scrollbar">
          {links.map((item) => {
            const isActive = currentPath === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[80px] sm:min-w-0 rounded-xl px-2 py-2.5 text-center transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 mb-1.5",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                />
                <span className="text-[11px] font-bold uppercase tracking-tight leading-none">
                  {t(labelMap[item.label] ?? item.label)}
                </span>
              </Link>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
}
