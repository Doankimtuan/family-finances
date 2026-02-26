import { ArrowLeftRight } from "lucide-react";
import Link from "next/link";

import { IncomeExpensesForm } from "@/app/onboarding/_components/income-expenses-form";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";

export const metadata = {
  title: "Cash Flow | Family Finances",
};

export default async function CashFlowPage() {
  return (
    <AppShell
      header={<AppHeader title="Income & Expenses" />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ArrowLeftRight className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Monthly Baselines
            </h2>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Configure your expected monthly income and essential expenses. These
            values are used for financial planning and health scoring.
          </p>
          <IncomeExpensesForm />
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Cash Flow History
          </h2>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Open reporting pages for monthly trend and review insights.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link href="/reports/cash-flow-trend" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                Cash-Flow Trend Report
              </Link>
              <Link href="/reports/monthly-review" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                Monthly Review
              </Link>
            </div>
          </div>
        </article>
      </div>
    </AppShell>
  );
}
