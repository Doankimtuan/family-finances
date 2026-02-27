"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  TrendingDown,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/providers/i18n-provider";

const tabs = [
  {
    labelKey: "nav.home",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    labelKey: "nav.money",
    href: "/accounts",
    icon: Wallet,
  },
  {
    labelKey: "nav.activity",
    href: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    labelKey: "nav.plan",
    href: "/insights",
    icon: TrendingDown,
  },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      className="grid h-16 grid-cols-4 bg-card"
      aria-label="Bottom navigation"
    >
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative flex h-full min-w-0 flex-col items-center justify-center gap-1.5 transition-all duration-300",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive && (
              <span className="absolute inset-x-2 top-0 h-1 rounded-b-full bg-primary animate-in fade-in slide-in-from-top-1 duration-300" />
            )}
            <Icon
              className={cn(
                "h-5.5 w-5.5 transition-transform duration-300",
                isActive && "scale-110",
              )}
            />
            <span
              className={cn(
                "line-clamp-1 px-1 text-[10px] font-bold uppercase tracking-[0.08em] transition-all",
                isActive ? "opacity-100" : "opacity-70",
              )}
            >
              {t(tab.labelKey)}
            </span>
            {isActive && (
              <span className="absolute inset-x-4 inset-y-2 rounded-xl bg-primary/5 -z-10 animate-in fade-in duration-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
