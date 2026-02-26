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
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Assets",
    href: "/assets",
    icon: Wallet,
  },
  {
    label: "Debts",
    href: "/debts",
    icon: TrendingDown, // Or another icon like 'ArrowDownCircle'
  },
  {
    label: "Flow",
    href: "/cash-flow",
    icon: ArrowLeftRight, // Will change icon to something like 'Activity'
  },
  {
    label: "Family",
    href: "/household",
    icon: Users,
  },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-around h-16">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-colors",
              isActive
                ? "text-slate-900"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            <Icon className={cn("h-6 w-6", isActive && "text-teal-600")} />
            <span className="text-[10px] font-medium uppercase tracking-wider">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
