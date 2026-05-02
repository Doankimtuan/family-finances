import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatVndCompact } from "@/lib/dashboard/format";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n/dictionary";

import { JarTrendChart } from "../_components/jar-trend-chart";

export const metadata = {
  title: "Jar Detail | Family Finances",
};

export default async function JarDetailPage({
  params,
}: {
  params: Promise<{ jarId: string }>;
}) {
  const { jarId } = await params;
  const { householdId, householdLocale, language } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();
  const [jarResult, balanceResult, monthlyResult, movementsResult] = await Promise.all([
    supabase
      .from("jars")
      .select("*")
      .eq("household_id", householdId)
      .eq("id", jarId)
      .eq("is_archived", false)
      .maybeSingle(),
    supabase
      .from("jar_current_balances")
      .select("*")
      .eq("household_id", householdId)
      .eq("jar_id", jarId)
      .maybeSingle(),
    supabase
      .from("jar_balances_monthly")
      .select("*")
      .eq("household_id", householdId)
      .eq("jar_id", jarId)
      .order("month", { ascending: true }),
    supabase
      .from("jar_movements")
      .select("id, movement_date, amount, balance_delta, location_from, location_to, source_type, note")
      .eq("household_id", householdId)
      .eq("jar_id", jarId)
      .order("movement_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (jarResult.error || !jarResult.data) {
    notFound();
  }
  if (balanceResult.error) throw new Error(balanceResult.error.message);
  if (monthlyResult.error) throw new Error(monthlyResult.error.message);
  if (movementsResult.error) throw new Error(movementsResult.error.message);

  const jar = jarResult.data;
  const balance = balanceResult.data;
  const monthlyRows = monthlyResult.data ?? [];
  const chartData = monthlyRows.map((row) => ({
    month: String(row.month).slice(0, 7),
    inflow: Number(row.inflow_amount ?? 0),
    outflow: Number(row.outflow_amount ?? 0),
    net: Number(row.net_change ?? 0),
  }));

  return (
    <AppShell
      header={<AppHeader title={jar.name} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 h-8 px-2 text-primary hover:text-primary/80">
            <Link href="/jars">
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t(language, "jars.back_to_jars")}
            </Link>
          </Button>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">{jar.name}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {t(language, "jars.field.jar_type")}:{" "}
            <span className="font-medium text-slate-900">
              {t(language, `jars.type.${jar.jar_type}`)}
            </span> ·{" "}
            {t(language, "jars.field.spend_policy")}:{" "}
            <span className="font-medium text-slate-900">
              {t(language, `jars.policy.${jar.spend_policy}`)}
            </span>
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric title={t(language, "jars.item.current_balance")} value={formatVndCompact(Number(balance?.current_balance ?? 0), householdLocale)} />
          <Metric title={t(language, "jars.metric.in_cash")} value={formatVndCompact(Number(balance?.held_in_cash ?? 0), householdLocale)} />
          <Metric title={t(language, "jars.metric.in_savings")} value={formatVndCompact(Number(balance?.held_in_savings ?? 0), householdLocale)} />
          <Metric title={t(language, "jars.metric.in_investments_assets")} value={formatVndCompact(Number(balance?.held_in_investments ?? 0) + Number(balance?.held_in_assets ?? 0), householdLocale)} />
        </div>

        <JarTrendChart data={chartData} locale={householdLocale} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">{t(language, "jars.holdings.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <HoldingRow label="Cash" value={Number(balance?.held_in_cash ?? 0)} locale={householdLocale} />
              <HoldingRow label="Savings" value={Number(balance?.held_in_savings ?? 0)} locale={householdLocale} />
              <HoldingRow label="Investments" value={Number(balance?.held_in_investments ?? 0)} locale={householdLocale} />
              <HoldingRow label="Assets" value={Number(balance?.held_in_assets ?? 0)} locale={householdLocale} />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">{t(language, "jars.movements.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(movementsResult.data ?? []).map((movement) => (
                <div
                  key={movement.id}
                  className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {movement.note ?? movement.source_type}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {movement.movement_date} · {movement.location_from ?? "?"} → {movement.location_to ?? "?"}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${movement.balance_delta === -1 ? "text-rose-600" : movement.balance_delta === 1 ? "text-emerald-600" : "text-slate-950"}`}>
                      {movement.balance_delta === -1 ? "-" : movement.balance_delta === 1 ? "+" : ""}
                      {formatVndCompact(Number(movement.amount ?? 0), householdLocale)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-4">
        <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">{title}</Label>
        <p className="text-2xl font-bold text-slate-950">{value}</p>
      </CardContent>
    </Card>
  );
}

function HoldingRow({
  label,
  value,
  locale,
}: {
  label: string;
  value: number;
  locale: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-slate-50 px-4 py-3">
      <Label className="text-sm text-slate-600 font-medium cursor-default">{label}</Label>
      <span className="text-sm font-semibold text-slate-950">
        {formatVndCompact(value, locale)}
      </span>
    </div>
  );
}
