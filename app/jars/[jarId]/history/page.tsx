import Link from "next/link";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import type {
  SpendingJarCategoryBreakdownRow,
  SpendingJarHistoryRow,
  SpendingJarSummaryRow,
  SpendingJarTxnRow,
} from "@/lib/jars/spending";

import { JarHistoryMonthlySummary } from "./_components/jar-history-monthly-summary";
import { JarHistoryTransactionList } from "./_components/jar-history-transaction-list";
import { JarHistoryCategoryBreakdown } from "./_components/jar-history-category-breakdown";

export const metadata = {
  title: "Jar History | Family Finances",
};

function parseMonthInput(value: string | undefined): string {
  if (value && /^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
  return `${new Date().toISOString().slice(0, 7)}-01`;
}

function toMonthControlValue(monthStart: string): string {
  return monthStart.slice(0, 7);
}

import { t } from "@/lib/i18n/dictionary";

export default async function JarHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ jarId: string }>;
  searchParams?: Promise<{ month?: string }>;
}) {
  const { jarId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedMonth = parseMonthInput(resolvedSearchParams?.month);

  const { householdId, language, householdLocale } =
    await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const jarResult = await supabase
    .from("jar_definitions")
    .select("id, name")
    .eq("household_id", householdId)
    .eq("id", jarId)
    .eq("is_archived", false)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (!jarResult.data?.id) {
    notFound();
  }

  const [historyResult, txResult, categoryBreakdownResult, summaryResult] =
    await Promise.all([
      supabase.rpc("rpc_spending_jar_history_months", {
        p_household_id: householdId,
        p_jar_id: jarId,
        p_months: 12,
      }),
      supabase.rpc("rpc_spending_jar_month_transactions", {
        p_household_id: householdId,
        p_jar_id: jarId,
        p_month: selectedMonth,
        p_limit: 100,
        p_offset: 0,
      }),
      supabase.rpc("rpc_spending_jar_month_category_breakdown", {
        p_household_id: householdId,
        p_jar_id: jarId,
        p_month: selectedMonth,
      }),
      supabase.rpc("rpc_spending_jar_monthly_summary", {
        p_household_id: householdId,
        p_month: selectedMonth,
      }),
    ]);

  const historyRows = (historyResult.data ?? []) as SpendingJarHistoryRow[];
  const txRows = ((txResult.data ?? []) as SpendingJarTxnRow[]).map((row) => ({
    ...row,
    amount: Number(row.amount ?? 0),
  }));
  const categoryRows = (
    (categoryBreakdownResult.data ?? []) as SpendingJarCategoryBreakdownRow[]
  ).map((row) => ({
    ...row,
    amount: Number(row.amount ?? 0),
  }));
  const summaryRows = (summaryResult.data ?? []) as SpendingJarSummaryRow[];
  const thisMonth = summaryRows.find((row) => row.jar_id === jarId) ?? null;

  return (
    <AppShell
      header={<AppHeader title={t(language, "jars.history.title")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24">
        <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl">
          <CardContent className="space-y-5 p-6">
            <SectionHeader
              label={t(language, "common.tracking")}
              title={jarResult.data.name}
              description={t(language, "jars.history.header")}
              className="[&_h2]:text-white [&_p]:text-white/80 [&_[class*='text-primary']]:text-white/70"
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/jars" className="text-sm font-semibold text-white hover:underline">
                {t(language, "jars.history.back_link")}
              </Link>

              <form action={`/jars/${jarId}/history`} method="get" className="flex items-center gap-2">
                <input
                  type="month"
                  name="month"
                  defaultValue={toMonthControlValue(selectedMonth)}
                  className="h-11 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white"
                />
                <button className="h-11 rounded-xl bg-white px-4 text-sm font-semibold text-slate-900" type="submit">
                  {t(language, "jars.history.view_month")}
                </button>
              </form>
            </div>
          </CardContent>
        </Card>

        {thisMonth ? (
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{t(language, "jars.history.month_status")}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedMonth} ·{" "}
                  {thisMonth.usage_percent === null
                    ? "—"
                    : `${Number(thisMonth.usage_percent).toFixed(1)}%`}
                </p>
              </div>
              <Badge
                className={
                  thisMonth.alert_level === "exceeded"
                    ? "bg-rose-100 text-rose-700 border-rose-200"
                    : thisMonth.alert_level === "warning"
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-emerald-100 text-emerald-700 border-emerald-200"
                }
              >
                {thisMonth.alert_level === "exceeded"
                  ? t(language, "jars.status.exceeded")
                  : thisMonth.alert_level === "warning"
                    ? t(language, "jars.status.warning")
                    : t(language, "jars.status.normal")}
              </Badge>
            </div>
          </div>
        ) : null}

        {(historyResult.error || txResult.error || categoryBreakdownResult.error) ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {historyResult.error?.message ?? txResult.error?.message ?? categoryBreakdownResult.error?.message}
          </div>
        ) : null}

        <JarHistoryMonthlySummary rows={historyRows} locale={householdLocale} language={language} />
        <JarHistoryCategoryBreakdown rows={categoryRows} locale={householdLocale} language={language} />
        <JarHistoryTransactionList rows={txRows} locale={householdLocale} language={language} />
      </div>
    </AppShell>
  );
}
