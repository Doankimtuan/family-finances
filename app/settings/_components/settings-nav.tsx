"use client";

import Link from "next/link";
import { memo, useMemo } from "react";

import { useI18n } from "@/lib/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { 
  User, 
  Home, 
  Users, 
  Tag, 
  TrendingUp 
} from "lucide-react";

const links = [
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/household", label: "Household", icon: Home },
  { href: "/settings/members", label: "Members", icon: Users },
  { href: "/settings/categories", label: "Categories", icon: Tag },
  { href: "/settings/assumptions", label: "Assumptions", icon: TrendingUp },
];

export const SettingsNav = memo(function SettingsNav({ currentPath }: { currentPath: string }) {
  const { t } = useI18n();

  const labelMap: Record<string, string> = useMemo(() => ({
    Profile: "settings.profile",
    Household: "settings.household",
    Members: "settings.members",
    Categories: "settings.categories",
    Assumptions: "settings.assumptions",
  }), []);

  return (
    <nav className="flex overflow-x-auto pb-4 gap-2 no-scrollbar scroll-smooth">
      {links.map((item) => {
        const isActive = currentPath === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center min-w-[100px] shrink-0 rounded-2xl px-3 py-3 text-center transition-all duration-300",
              isActive
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                : "bg-white border border-slate-200 text-slate-500 hover:border-primary/50 hover:text-primary hover:shadow-md",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 mb-1.5",
                isActive
                  ? "text-primary-foreground"
                  : "text-slate-400 transition-colors group-hover:text-primary",
              )}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
              {t(labelMap[item.label] ?? item.label)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
});
