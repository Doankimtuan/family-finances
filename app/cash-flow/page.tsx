import { ArrowLeftRight } from "lucide-react";

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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <ArrowLeftRight className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-900">
              No transactions recorded
            </p>
            <p className="max-w-[240px] text-xs text-slate-500 mt-1 italic">
              Record your daily income and expenses in the Transactions module
              (coming soon) to see your actual cash flow here.
            </p>
          </div>
        </article>
      </div>
    </AppShell>
  );
}
