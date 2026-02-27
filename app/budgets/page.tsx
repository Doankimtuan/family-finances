import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { formatVnd, formatVndCompact } from "@/lib/dashboard/format";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import {
  Receipt,
  Calendar,
  TrendingUp,
  Wallet,
  Tags,
  PlusCircle,
} from "lucide-react";

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
  const selectedMonth = /^\d{4}-\d{2}$/.test(params?.month ?? "")
    ? (params?.month as string)
    : fallbackMonth;
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
  const totalPlanned = budgets.reduce(
    (sum, row) => sum + Number(row.planned_amount),
    0,
  );
  const totalSpent = Array.from(spentMap.values()).reduce(
    (sum, n) => sum + n,
    0,
  );
  const totalRemaining = totalPlanned - totalSpent;

  return (
    <AppShell
      header={<AppHeader title="Monthly Budgets" />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard label="Month" value={selectedMonth} icon={Calendar} />
          <MetricCard
            label="Planned"
            value={formatVndCompact(totalPlanned)}
            icon={Receipt}
          />
          <MetricCard
            label="Actual"
            value={formatVndCompact(totalSpent)}
            icon={TrendingUp}
            variant={totalSpent > totalPlanned ? "destructive" : "default"}
          />
          <MetricCard
            label="Balance"
            value={formatVndCompact(totalRemaining)}
            icon={Wallet}
            variant={totalRemaining >= 0 ? "success" : "destructive"}
          />
        </section>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <SectionHeader
                label="Planning"
                title="Budget Setup"
                description="Plan monthly spending by category and compare against actual expenses."
              />
              <Link
                href="/categories"
                className="text-xs font-bold text-primary hover:underline underline-offset-4 flex animate-in fade-in duration-1000"
              >
                <Tags className="mr-1.5 h-3.5 w-3.5" />
                Categories
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <MonthlyBudgetForm
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
              monthDefault={selectedMonth}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <SectionHeader label="Analysis" title="Budget vs Actual" />

          {budgetsResult.error || txResult.error ? (
            <EmptyState
              icon={Receipt}
              title="Error loading analysis"
              description="There was a problem calculating your budget performance."
              className="bg-destructive/5 border-destructive/20"
            />
          ) : budgets.length === 0 ? (
            <EmptyState
              icon={PlusCircle}
              title="No budget entries"
              description="Create your first budget entry for this month using the form above."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {budgets.map((row) => {
                const planned = Number(row.planned_amount);
                const spent = spentMap.get(row.category_id) ?? 0;
                const utilization =
                  planned > 0 ? Math.round((spent / planned) * 100) : 0;
                const over = spent - planned;

                return (
                  <Card
                    key={row.id}
                    className="group hover:border-primary/30 transition-all duration-300"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="truncate text-sm font-bold text-foreground">
                              {categoryMap.get(row.category_id) ??
                                "Unknown category"}
                            </h3>
                            <Badge
                              variant={over > 0 ? "destructive" : "success"}
                              className="text-[10px] uppercase font-bold"
                            >
                              {over > 0 ? "Over" : "On Track"}
                            </Badge>
                          </div>

                          <div className="flex items-baseline justify-between text-xs mb-3">
                            <span className="text-muted-foreground">
                              Planned{" "}
                              <span className="font-bold text-foreground">
                                {formatVnd(planned)}
                              </span>
                            </span>
                            <span className="font-bold text-foreground">
                              {formatVnd(spent)}
                            </span>
                          </div>

                          <Progress
                            value={utilization}
                            variant={
                              over > 0
                                ? "destructive"
                                : utilization > 85
                                  ? "warning"
                                  : "success"
                            }
                            className="h-2"
                          />

                          <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span
                              className={
                                over > 0 ? "text-destructive" : "text-success"
                              }
                            >
                              {over > 0
                                ? `${formatVndCompact(over)} over`
                                : `${formatVndCompact(Math.abs(over))} left`}
                            </span>
                            <span className="text-muted-foreground">
                              {utilization}%
                            </span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DeleteBudgetButton budgetId={row.id} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
