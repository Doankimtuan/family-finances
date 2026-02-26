import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { getDashboardTrend } from "@/lib/dashboard/trend";
import { formatVndCompact } from "@/lib/dashboard/format";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

import { CashFlowTrendChart } from "../_components/cash-flow-trend-chart";

export const metadata = {
  title: "Cash-Flow Trend | Reports",
};

export default async function CashFlowTrendPage() {
  const { householdId } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const trend = await getDashboardTrend(supabase, householdId, {
    months: 12,
    asOfDate: new Date().toISOString().slice(0, 10),
  });
  const latest = trend.at(-1);

  return (
    <AppShell header={<AppHeader title="Cash-Flow Trend" showBack />} footer={<BottomTabBar />}>
      <div className="space-y-4 pb-20 sm:pb-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Latest Month</p>
          <p className="mt-1 text-sm text-slate-700">Income {latest ? formatVndCompact(Number(latest.income)) : "-"} · Expense {latest ? formatVndCompact(Number(latest.expense)) : "-"}</p>
          <p className={`mt-1 text-sm ${latest && Number(latest.savings) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            Savings {latest ? formatVndCompact(Number(latest.savings)) : "-"}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <CashFlowTrendChart points={trend} />
        </article>
      </div>
    </AppShell>
  );
}
