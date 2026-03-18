import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPercent, formatVnd } from "@/lib/dashboard/format";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { buildSavingsDetailPayload, fetchSavingsBundle } from "@/lib/savings/service";
import { MatureSavingsForm } from "@/app/money/savings/_components/mature-savings-form";
import { SavingsValueChart } from "@/app/money/savings/_components/savings-value-chart";
import { WithdrawSavingsForm } from "@/app/money/savings/_components/withdraw-savings-form";

type Props = {
  params: Promise<{ id: string }>;
};

function maturityPreferenceLabel(
  preference: string | null,
  language: "en" | "vi",
) {
  if (preference === "renew_same") {
    return t(language, "savings.form.option.maturity.renew_same");
  }
  if (preference === "switch_plan") {
    return t(language, "savings.form.option.maturity.switch_plan");
  }
  if (preference === "withdraw") {
    return t(language, "savings.form.option.maturity.withdraw");
  }
  return t(language, "savings.detail.value.none");
}

export default async function SavingsDetailPage({ params }: Props) {
  const { id } = await params;
  const { householdId, householdLocale, language } =
    await getAuthenticatedHouseholdContext();
  const supabase = await createClient();
  const bundle = await fetchSavingsBundle(supabase, householdId, { id });
  const account = bundle.accounts[0];
  if (!account) {
    return (
      <AppShell
        header={<AppHeader title={t(language, "savings.title")} />}
        footer={<BottomTabBar />}
      >
        <p className="text-sm text-rose-600">{t(language, "savings.detail.not_found")}</p>
      </AppShell>
    );
  }

  const detail = buildSavingsDetailPayload(
    account,
    bundle.withdrawals.filter((row) => row.savings_account_id === id),
    Array.from(bundle.rates.values()).filter(
      (row) => row.provider_name === account.provider_name,
    ),
    bundle.actions.filter((row) => row.savings_account_id === id),
    new Date().toISOString().slice(0, 10),
  );
  const accounts = (
    (await supabase
      .from("accounts")
      .select("id, name")
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .order("created_at", { ascending: true })).data ?? []
  ) as Array<{ id: string; name: string }>;

  return (
    <AppShell
      header={<AppHeader title={t(language, "savings.detail.title")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link href="/money/savings" className="text-sm font-medium text-primary hover:underline">
              ← {t(language, "savings.detail.back_to_list")}
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              {account.provider_name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {account.product_name ?? t(language, "savings.detail.default_name")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <WithdrawSavingsForm
              savings={account}
              computed={detail.computed}
              accounts={accounts}
            />
            <MatureSavingsForm
              savings={account}
              computed={detail.computed}
              accounts={accounts}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t(language, "savings.detail.metric.principal")}</p><p className="mt-2 text-lg font-semibold text-slate-900">{formatVnd(detail.computed.principal, householdLocale)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t(language, "savings.detail.metric.accrued")}</p><p className="mt-2 text-lg font-semibold text-emerald-700">{formatVnd(detail.computed.accruedInterest, householdLocale)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t(language, "savings.detail.metric.net_value")}</p><p className="mt-2 text-lg font-semibold text-slate-900">{formatVnd(detail.computed.netValue, householdLocale)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t(language, "savings.detail.metric.rate")}</p><p className="mt-2 text-lg font-semibold text-slate-900">{formatPercent(account.annual_rate)}</p></CardContent></Card>
        </div>

        <SavingsValueChart
          points={detail.projection.points}
          todayIndex={0}
          locale={householdLocale}
        />

        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-3 bg-slate-100 p-1">
            <TabsTrigger value="overview">{t(language, "savings.detail.section.overview")}</TabsTrigger>
            <TabsTrigger value="withdrawals">{t(language, "savings.detail.section.withdrawals")}</TabsTrigger>
            <TabsTrigger value="rates">{t(language, "savings.detail.section.rates")}</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-slate-500">{t(language, "savings.detail.field.start_date")}</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{account.start_date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{t(language, "savings.detail.field.maturity_date")}</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{account.maturity_date ?? t(language, "savings.detail.value.flexible")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{t(language, "savings.detail.field.tax_rate")}</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{formatPercent(account.tax_rate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{t(language, "savings.detail.field.maturity_action")}</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {maturityPreferenceLabel(account.maturity_preference, language)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{t(language, "savings.detail.field.term_type")}</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {account.term_mode === "fixed"
                      ? t(language, "savings.form.option.term.fixed")
                      : t(language, "savings.form.option.term.flexible")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{t(language, "savings.detail.field.notes")}</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{account.notes ?? t(language, "savings.detail.value.none")}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="withdrawals" className="mt-4">
            <Card>
              <CardContent className="space-y-3 p-4">
                {detail.withdrawals.length === 0 ? (
                  <p className="text-sm text-slate-500">{t(language, "savings.detail.empty.withdrawals")}</p>
                ) : (
                  detail.withdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="rounded-2xl border border-border/60 p-4">
                      <p className="text-sm font-semibold text-slate-900">{withdrawal.withdrawal_date}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {t(language, "savings.detail.withdrawal.principal")}: {formatVnd(withdrawal.requested_principal_amount, householdLocale)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {t(language, "savings.detail.withdrawal.interest")}: {formatVnd(withdrawal.gross_interest_amount, householdLocale)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {t(language, "savings.detail.withdrawal.net")}: {formatVnd(withdrawal.net_received_amount, householdLocale)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="rates" className="mt-4">
            <Card>
              <CardContent className="space-y-3 p-4">
                {detail.rates.length === 0 ? (
                  <p className="text-sm text-slate-500">{t(language, "savings.detail.empty.rates")}</p>
                ) : (
                  detail.rates.map((rate) => (
                    <div key={rate.id} className="rounded-2xl border border-border/60 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {rate.effective_from} · {formatPercent(rate.annual_rate)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {rate.product_name ?? account.provider_name}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
