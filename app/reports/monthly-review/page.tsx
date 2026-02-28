import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { formatPercent, formatVndCompact } from "@/lib/dashboard/format";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Monthly Review | Reports",
};

function monthRange(asOf: Date) {
  const start = new Date(
    Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), 1),
  );
  const end = new Date(
    Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() + 1, 1),
  );
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default async function MonthlyReviewPage() {
  const { householdId } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();
  const now = new Date();
  const { start, end } = monthRange(now);

  const [coreResult, txResult, categoriesResult, goalsResult] =
    await Promise.all([
      supabase.rpc("rpc_dashboard_core", {
        p_household_id: householdId,
        p_as_of_date: now.toISOString().slice(0, 10),
      }),
      supabase
        .from("transactions")
        .select("category_id, amount, type")
        .eq("household_id", householdId)
        .gte("transaction_date", start)
        .lt("transaction_date", end),
      supabase
        .from("categories")
        .select("id, name")
        .or(`household_id.is.null,household_id.eq.${householdId}`),
      supabase
        .from("goals")
        .select("id, name, target_amount")
        .eq("household_id", householdId)
        .eq("status", "active"),
    ]);

  const metrics = (coreResult.data ?? [])[0] ?? null;
  const categoryMap = new Map(
    (categoriesResult.data ?? []).map((c) => [c.id, c.name]),
  );

  const expenseMap = new Map<string, number>();
  for (const tx of txResult.data ?? []) {
    if (tx.type !== "expense" || !tx.category_id) continue;
    expenseMap.set(
      tx.category_id,
      (expenseMap.get(tx.category_id) ?? 0) + Number(tx.amount),
    );
  }

  const topCategories = Array.from(expenseMap.entries())
    .map(([id, value]) => ({
      id,
      name: categoryMap.get(id) ?? "Uncategorized",
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const wins: string[] = [];
  const risks: string[] = [];

  if (metrics) {
    if (Number(metrics.monthly_savings) > 0)
      wins.push("Positive monthly savings maintained.");
    else risks.push("Monthly savings is negative.");

    if ((metrics.emergency_months ?? 0) >= 3)
      wins.push("Emergency runway is above 3 months.");
    else risks.push("Emergency runway is below 3 months.");

    if ((metrics.debt_service_ratio ?? 0) > 0.35)
      risks.push("Debt-service ratio is above 35%.");
  }

  const actions = [
    risks.includes("Monthly savings is negative.")
      ? "Reduce one variable spending category by at least 10% next month."
      : "Keep automatic savings transfer on salary day.",
    risks.includes("Debt-service ratio is above 35%.")
      ? "Prioritize extra debt payment before new discretionary spending."
      : "Review top spending category and keep within budget.",
  ];

  return (
    <AppShell
      header={<AppHeader title="Monthly Review" showBack />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-4 pb-20 sm:pb-6">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
              Month Snapshot
            </p>
            {metrics ? (
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <Stat
                  label="Income"
                  value={formatVndCompact(Number(metrics.monthly_income))}
                />
                <Stat
                  label="Expense"
                  value={formatVndCompact(Number(metrics.monthly_expense))}
                />
                <Stat
                  label="Savings"
                  value={formatVndCompact(Number(metrics.monthly_savings))}
                />
                <Stat
                  label="Savings Rate"
                  value={formatPercent(metrics.savings_rate)}
                />
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No monthly metrics yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Top Expense Categories
            </h2>
            {topCategories.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                No expense transactions this month.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {topCategories.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-slate-200 p-3 text-sm text-slate-700"
                  >
                    {c.name}: {formatVndCompact(c.value)}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Wins & Risks
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                  Wins
                </p>
                <ul className="mt-1 space-y-1 text-sm text-slate-700">
                  {(wins.length > 0
                    ? wins
                    : ["No major wins detected yet this month."]
                  ).map((w) => (
                    <li key={w}>• {w}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">
                  Risks
                </p>
                <ul className="mt-1 space-y-1 text-sm text-slate-700">
                  {(risks.length > 0
                    ? risks
                    : ["No critical risk signal this month."]
                  ).map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Next Month Actions
            </h2>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {actions.map((a) => (
                <li key={a}>• {a}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Active goals: {(goalsResult.data ?? []).length}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
