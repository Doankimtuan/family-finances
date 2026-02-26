import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";

export const metadata = {
  title: "Settings | Family Finances",
};

const sections = [
  {
    href: "/settings/profile",
    title: "Profile",
    description: "Update your name and account identity details.",
  },
  {
    href: "/settings/household",
    title: "Household",
    description: "Manage shared household identity, locale, and timezone.",
  },
  {
    href: "/settings/categories",
    title: "Categories",
    description: "Control income and expense category taxonomy.",
  },
  {
    href: "/settings/assumptions",
    title: "Assumptions",
    description: "Set inflation and return assumptions used in projections.",
  },
];

export default function SettingsIndexPage() {
  return (
    <AppShell header={<AppHeader title="Settings" />} footer={<BottomTabBar />}>
      <section className="space-y-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">
            Keep these settings current so dashboards, projections, and collaboration stay accurate for both partners.
          </p>
        </article>

        <div className="grid grid-cols-1 gap-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300"
            >
              <p className="text-base font-semibold text-slate-900">{section.title}</p>
              <p className="mt-1 text-sm text-slate-600">{section.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
