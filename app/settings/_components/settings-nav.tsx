import Link from "next/link";

import { cn } from "@/lib/utils";

const links = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/household", label: "Household" },
  { href: "/settings/categories", label: "Categories" },
  { href: "/settings/assumptions", label: "Assumptions" },
];

export function SettingsNav({ currentPath }: { currentPath: string }) {
  return (
    <nav className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-4">
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
