import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";

export const metadata = {
  title: "Reports | Family Finances",
};

export default function ReportsPage() {
  return (
    <AppShell header={<AppHeader title="Reports" />} footer={<BottomTabBar />}>
      <div className="space-y-4 pb-20 sm:pb-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Monthly reporting hub</h1>
          <p className="mt-1 text-sm text-slate-600">Review trend direction and complete your monthly financial review with one source of truth.</p>
        </article>

        <nav className="grid grid-cols-1 gap-3">
          <Link href="/reports/net-worth-trend" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Net Worth Trend</p>
            <p className="mt-1 text-xs text-slate-500">Track long-term wealth direction month by month.</p>
          </Link>
          <Link href="/reports/cash-flow-trend" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Cash-Flow Trend</p>
            <p className="mt-1 text-xs text-slate-500">Compare income, expenses, and savings trend over time.</p>
          </Link>
          <Link href="/reports/monthly-review" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Monthly Review</p>
            <p className="mt-1 text-xs text-slate-500">Summarize wins, risks, and next month actions.</p>
          </Link>
        </nav>
      </div>
    </AppShell>
  );
}
