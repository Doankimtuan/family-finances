import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { formatVnd } from "@/lib/dashboard/format";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

import { DeleteBudgetButton } from "./_components/delete-budget-button";
import { MonthlyBudgetForm } from "./_components/monthly-budget-form";

export const metadata = {
  title: "Budgets | Family Finances",
};

type BudgetRow = {
  id: string;
  category_id: string;
  planned_amount: number;
};

type CategoryRow = {
  id: string;
  name: string;
};

function toMonthInput(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function firstDate(monthInput: string): string {
  return `${monthInput}-01`;
}

function nextMonthFirstDate(monthInput: string): string {
  const [year, month] = monthInput.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, 1));
  d.setUTCMonth(d.getUTCMonth() + 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const { householdId } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();
  const params = searchParams ? await searchParams : undefined;

  const fallbackMonth = toMonthInput(new Date());
  const selectedMonth = /^\d{4}-\d{2}$/.test(params?.month ?? "") ? (params?.month as string) : fallbackMonth;
  const monthStart = firstDate(selectedMonth);
  const monthEndExclusive = nextMonthFirstDate(selectedMonth);

  const [categoriesResult, budgetsResult, txResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .or(`household_id.is.null,household_id.eq.${householdId}`)
      .eq("kind", "expense")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("monthly_budgets")
      .select("id, category_id, planned_amount")
      .eq("household_id", householdId)
      .eq("month", monthStart),
    supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("household_id", householdId)
      .eq("type", "expense")
      .gte("transaction_date", monthStart)
      .lt("transaction_date", monthEndExclusive),
  ]);

  const categories = (categoriesResult.data ?? []) as CategoryRow[];
  const budgets = (budgetsResult.data ?? []) as BudgetRow[];
  const spentMap = new Map<string, number>();

  for (const row of txResult.data ?? []) {
    if (!row.category_id) continue;
    const current = spentMap.get(row.category_id) ?? 0;
    spentMap.set(row.category_id, current + Number(row.amount));
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const totalPlanned = budgets.reduce((sum, row) => sum + Number(row.planned_amount), 0);
  const totalSpent = Array.from(spentMap.values()).reduce((sum, n) => sum + n, 0);

  return (
    <AppShell header={<AppHeader title="Monthly Budgets" />} footer={<BottomTabBar />}>
      <div className="space-y-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Budget Setup</h2>
            <Link href="/categories" className="text-sm font-medium text-slate-600 underline-offset-2 hover:underline">
              Manage Categories
            </Link>
          </div>
          <p className="mt-1 text-sm text-slate-600">Plan monthly spending by category and compare against actual expenses.</p>
          <div className="mt-4">
            <MonthlyBudgetForm
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
              monthDefault={selectedMonth}
            />
          </div>
        </article>

        <article className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Month</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{selectedMonth}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Planned</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{formatVnd(totalPlanned)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Actual</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{formatVnd(totalSpent)}</p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Budget vs Actual</h2>
          {budgetsResult.error || txResult.error ? (
            <p className="mt-2 text-sm text-rose-600">Could not load monthly budget analysis.</p>
          ) : budgets.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No budget entries for this month yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {budgets.map((row) => {
                const planned = Number(row.planned_amount);
                const spent = spentMap.get(row.category_id) ?? 0;
                const utilization = planned > 0 ? Math.round((spent / planned) * 100) : 0;
                const over = spent - planned;

                return (
                  <li key={row.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {categoryMap.get(row.category_id) ?? "Unknown category"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Planned {formatVnd(planned)} · Actual {formatVnd(spent)}
                        </p>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full ${over > 0 ? "bg-rose-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.max(4, Math.min(utilization, 100))}%` }}
                          />
                        </div>
                        <p className={`mt-1 text-xs ${over > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {over > 0 ? `${formatVnd(over)} over budget` : `${formatVnd(Math.abs(over))} under budget`}
                        </p>
                      </div>
                      <DeleteBudgetButton budgetId={row.id} />
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
