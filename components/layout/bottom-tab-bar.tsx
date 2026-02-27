"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  TrendingDown,
  ArrowLeftRight,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/providers/i18n-provider";

const tabs = [
  {
    labelKey: "nav.overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    labelKey: "nav.assets",
    href: "/assets",
    icon: Wallet,
  },
  {
    labelKey: "nav.debts",
    href: "/debts",
    icon: TrendingDown, // Or another icon like 'ArrowDownCircle'
  },
  {
    labelKey: "nav.flow",
    href: "/cash-flow",
    icon: ArrowLeftRight, // Will change icon to something like 'Activity'
  },
  {
    labelKey: "nav.family",
    href: "/household",
    icon: Users,
  },
  {
    labelKey: "settings.title",
    href: "/settings",
    icon: Settings,
  },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="grid h-16 grid-cols-6 bg-white" aria-label="Bottom navigation">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex h-full min-w-0 flex-col items-center justify-center gap-1 transition-colors",
              isActive
                ? "text-slate-900"
                : "text-slate-700 hover:text-slate-900",
            )}
          >
            <Icon className={cn("h-5 w-5", isActive ? "text-teal-600" : "text-slate-700")} />
            <span className="line-clamp-1 px-1 text-[10px] font-medium uppercase tracking-wide">
              {t(tab.labelKey)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
