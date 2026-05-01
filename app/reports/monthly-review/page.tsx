import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { formatPercent, formatVndCompact } from "@/lib/dashboard/format";
import { t } from "@/lib/i18n/dictionary";
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
  const { householdId, language } = await getAuthenticatedHouseholdContext();
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
      name: categoryMap.get(id) ?? t(language, "reports.monthly_review.uncategorized"),
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const WIN_POSITIVE_SAVINGS = t(language, "reports.monthly_review.win.positive_savings");
  const WIN_EMERGENCY_OK = t(language, "reports.monthly_review.win.emergency_ok");
  const RISK_NEGATIVE_SAVINGS = t(language, "reports.monthly_review.risk.negative_savings");
  const RISK_LOW_EMERGENCY = t(language, "reports.monthly_review.risk.low_emergency");
  const RISK_HIGH_DSR = t(language, "reports.monthly_review.risk.high_dsr");

  const wins: string[] = [];
  const risks: string[] = [];

  if (metrics) {
    if (Number(metrics.monthly_savings) > 0)
      wins.push(WIN_POSITIVE_SAVINGS);
    else risks.push(RISK_NEGATIVE_SAVINGS);

    if ((metrics.emergency_months ?? 0) >= 3)
      wins.push(WIN_EMERGENCY_OK);
    else risks.push(RISK_LOW_EMERGENCY);

    if ((metrics.debt_service_ratio ?? 0) > 0.35)
      risks.push(RISK_HIGH_DSR);
  }

  const actions = [
    risks.includes(RISK_NEGATIVE_SAVINGS)
      ? t(language, "reports.monthly_review.action.cut_spending")
      : t(language, "reports.monthly_review.action.keep_transfer"),
    risks.includes(RISK_HIGH_DSR)
      ? t(language, "reports.monthly_review.action.pay_debt")
      : t(language, "reports.monthly_review.action.review_top"),
  ];

  return (
    <AppShell
      header={<AppHeader title={t(language, "reports.monthly_review.title")} leftAction={<AppHeader.BackButton />} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-4 pb-20 sm:pb-6">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t(language, "reports.monthly_review.snapshot")}
            </p>
            {metrics ? (
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <Stat
                  label={t(language, "reports.monthly_review.income")}
                  value={formatVndCompact(Number(metrics.monthly_income))}
                />
                <Stat
                  label={t(language, "reports.monthly_review.expense")}
                  value={formatVndCompact(Number(metrics.monthly_expense))}
                />
                <Stat
                  label={t(language, "reports.monthly_review.savings")}
                  value={formatVndCompact(Number(metrics.monthly_savings))}
                />
                <Stat
                  label={t(language, "reports.monthly_review.savings_rate")}
                  value={formatPercent(metrics.savings_rate)}
                />
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {t(language, "reports.monthly_review.no_metrics")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold text-foreground">
              {t(language, "reports.monthly_review.top_categories")}
            </h2>
            {topCategories.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {t(language, "reports.monthly_review.no_expenses")}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {topCategories.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-border p-3 text-sm text-foreground"
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
            <h2 className="text-lg font-semibold text-foreground">
              {t(language, "reports.monthly_review.wins_risks")}
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-success">
                  {t(language, "reports.monthly_review.wins")}
                </p>
                <ul className="mt-1 space-y-1 text-sm text-foreground">
                  {(wins.length > 0
                    ? wins
                    : [t(language, "reports.monthly_review.no_wins")]
                  ).map((w) => (
                    <li key={w}>• {w}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-destructive">
                  {t(language, "reports.monthly_review.risks")}
                </p>
                <ul className="mt-1 space-y-1 text-sm text-foreground">
                  {(risks.length > 0
                    ? risks
                    : [t(language, "reports.monthly_review.no_risks")]
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
            <h2 className="text-lg font-semibold text-foreground">
              {t(language, "reports.monthly_review.next_actions")}
            </h2>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              {actions.map((a) => (
                <li key={a}>• {a}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              {t(language, "reports.monthly_review.active_goals")}: {(goalsResult.data ?? []).length}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
