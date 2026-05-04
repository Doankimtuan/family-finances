import Link from "next/link";
import { ArrowRight, CalendarClock, HandCoins, PiggyBank } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatVndCompact } from "@/lib/dashboard/format";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { AddSavingsForm } from "@/app/money/savings/_components/add-savings-form";
import { SavingsCard } from "@/app/money/savings/_components/savings-card";
import {
  buildSavingsListItems,
  buildSavingsSummary,
  fetchSavingsBundle,
} from "@/lib/savings/service";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Savings | Family Finances",
};

export default async function SavingsPage() {
  const { householdId, householdLocale, language } =
    await getAuthenticatedHouseholdContext();
  const supabase = await createClient();
  const bundle = await fetchSavingsBundle(supabase, householdId);
  const items = buildSavingsListItems(
    bundle.accounts,
    bundle.withdrawals,
    bundle.goals,
    new Date().toISOString().slice(0, 10),
  );
  const summary = buildSavingsSummary(items);
  const bankItems = items.filter((item) => item.savingsType === "bank");
  const appItems = items.filter((item) => item.savingsType === "third_party");
  const accounts = ((
    await supabase
      .from("accounts")
      .select("id, name")
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
  ).data ?? []) as Array<{ id: string; name: string }>;
  const goals = Array.from(bundle.goals.entries()).map(([id, name]) => ({
    id,
    name,
  }));
  const jars = ((
    await supabase
      .from("jars")
      .select("id, name")
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
  ).data ?? []) as Array<{ id: string; name: string }>;
  const nextMaturityLabel =
    summary.nextMaturity?.maturityDate ?? t(language, "savings.summary.none");
  const upcomingCountLabel = `${summary.upcomingCount30d} ${t(language, "savings.summary.deposits")}`;

  return (
    <AppShell
      header={<AppHeader title={t(language, "savings.title")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24">
        <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-slate-50 via-white to-emerald-50/60">
          <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl space-y-2">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <PiggyBank className="h-3.5 w-3.5" />
                  {t(language, "savings.header.title")}
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                    {t(language, "savings.header.title")}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {t(language, "savings.header.description")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <AddSavingsForm
                  accounts={accounts}
                  goals={goals}
                  jars={jars}
                  triggerLabel={t(language, "savings.add")}
                />
                <Button
                  asChild
                  variant="ghost"
                  className="justify-start px-0 sm:justify-end"
                >
                  <Link href="/money">
                    {t(language, "savings.back_to_money")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border-border/60 bg-white/80">
                <CardContent className="p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t(language, "savings.summary.total_value")}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatVndCompact(summary.totalGrossValue, householdLocale)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-white/80">
                <CardContent className="p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t(language, "savings.summary.liquid_value")}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatVndCompact(
                      summary.totalLiquidationValue,
                      householdLocale,
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-white/80">
                <CardContent className="p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t(language, "savings.summary.accrued_interest")}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">
                    {formatVndCompact(
                      summary.totalAccruedInterest,
                      householdLocale,
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-white/80">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {t(language, "savings.summary.next_maturity")}
                  </div>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {nextMaturityLabel}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {t(language, "savings.summary.upcoming_count")}:{" "}
                    {upcomingCountLabel}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {items.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title={t(language, "savings.empty.title")}
            description={t(language, "savings.empty.description")}
            className="min-h-[260px] border-border/60 bg-slate-50/60"
            action={
              <AddSavingsForm
                accounts={accounts}
                goals={goals}
                jars={jars}
                triggerLabel={t(language, "savings.empty.action")}
              />
            }
          />
        ) : (
          <div className="space-y-8">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-slate-900">
                    {t(language, "savings.group.bank")}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {t(language, "savings.form.type.bank.description")}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                  {bankItems.length}
                </span>
              </div>
              <div className="space-y-3">
                {bankItems.map((item) => (
                  <SavingsCard
                    key={item.id}
                    item={item}
                    locale={householdLocale}
                    href={`/money/savings/${item.id}`}
                  />
                ))}
                {bankItems.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    {t(language, "savings.group.bank.empty")}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-slate-900">
                    {t(language, "savings.group.third_party")}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {t(language, "savings.form.type.third_party.description")}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                  {appItems.length}
                </span>
              </div>
              <div className="space-y-3">
                {appItems.map((item) => (
                  <SavingsCard
                    key={item.id}
                    item={item}
                    locale={householdLocale}
                    href={`/money/savings/${item.id}`}
                  />
                ))}
                {appItems.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    {t(language, "savings.group.third_party.empty")}
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
