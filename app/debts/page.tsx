import Link from "next/link";
import { TrendingDown } from "lucide-react";

import { DebtsForm } from "@/app/onboarding/_components/debts-form";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { formatVnd } from "@/lib/dashboard/format";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Debts | Family Finances",
};

type DebtRow = {
  id: string;
  name: string;
  liability_type: string;
  current_principal_outstanding: number;
  principal_original: number;
  next_payment_date: string | null;
};

export default async function DebtsPage() {
  const { householdId } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const debtsResult = await supabase
    .from("liabilities")
    .select(
      "id, name, liability_type, current_principal_outstanding, principal_original, next_payment_date",
    )
    .eq("household_id", householdId)
    .eq("is_active", true)
    .order("current_principal_outstanding", { ascending: false });

  const debts = (debtsResult.data ?? []) as DebtRow[];

  return (
    <AppShell
      header={<AppHeader title="Debts & Liabilities" />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5 text-rose-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Add New Debt
            </h2>
          </div>
          <DebtsForm />
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Current Liabilities
          </h2>

          {debtsResult.error ? (
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
              {debtsResult.error.message}
            </div>
          ) : debts.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 italic">
              No debts tracked yet. Stay debt-free or add a loan above.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {debts.map((debt) => {
                const progress = Math.round(
                  (1 -
                    debt.current_principal_outstanding /
                      debt.principal_original) *
                    100,
                );

                return (
                  <li key={debt.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {debt.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {debt.liability_type.replace(/_/g, " ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">
                            {formatVnd(debt.current_principal_outstanding)}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            remaining
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <span>Payoff Progress</span>
                          <span>{progress}% Paid</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-rose-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <Link
                        href={`/debts/${debt.id}`}
                        className="inline-flex rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                      >
                        Open Detail
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </div>
    </AppShell>
  );
}
