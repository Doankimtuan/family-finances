"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/providers/i18n-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isFeatureEnabled } from "@/lib/config/features";

const baseTabs = [
  {
    labelKey: "nav.home",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    labelKey: "nav.accounts",
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
    href: "/jars",
    icon: PiggyBank,
  },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const tabs = isFeatureEnabled("jars")
    ? baseTabs
    : baseTabs.filter((tab) => tab.href !== "/jars");

  return (
    <nav
      className={cn(
        "grid h-16 bg-card",
        tabs.length === 4 ? "grid-cols-4" : "grid-cols-3",
      )}
      aria-label="Bottom navigation"
    >
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;

        return (
          <Tooltip key={tab.href}>
            <TooltipTrigger asChild>
              <Link
                href={tab.href}
                className={cn(
                  "relative flex h-full min-w-0 flex-col items-center justify-center gap-1.5 transition-all duration-300",
                  isActive
                    ? "text-primary border-t-2 border-primary bg-primary/3"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/5",
                )}
              >
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
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{t(tab.labelKey)}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
