"use client";

import Link from "next/link";

import { useI18n } from "@/lib/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const links = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/household", label: "Household" },
  { href: "/settings/members", label: "Members" },
  { href: "/settings/categories", label: "Categories" },
  { href: "/settings/assumptions", label: "Assumptions" },
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
    <Card>
      <CardContent className="p-2">
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {links.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-3 py-2 text-center text-sm font-semibold transition",
                  isActive
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100",
                )}
              >
                {t(labelMap[item.label] ?? item.label)}
              </Link>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
}
