import Link from "next/link";
import { ArrowRight, Plus, Repeat, Wallet, Calendar, Bell } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n/dictionary";
import { formatVndCompact } from "@/lib/dashboard/format";

import { RecurringRuleList } from "./_components/recurring-rule-list";
import { CreateRecurringDialog } from "./_components/create-recurring-dialog";

type RecurringRule = {
  id: string;
  template_json: {
    type: "income" | "expense";
    amount: number;
    description: string;
    account_id: string;
    category_id?: string;
  };
  frequency: "weekly" | "monthly";
  interval: number;
  day_of_month?: number;
  day_of_week?: number;
  start_date: string;
  end_date?: string;
  next_run_date?: string;
  is_active: boolean;
};

export const metadata = {
  title: "Recurring | Family Finances",
};

export default async function RecurringPage() {
  const { householdId, language, householdLocale } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const [rulesResult, accountsResult, categoriesResult] = await Promise.all([
    supabase
      .from("recurring_rules")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false }),
    supabase
      .from("accounts")
      .select("id, name")
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .is("deleted_at", null),
    supabase
      .from("categories")
      .select("id, name, kind")
      .or(`household_id.is.null,household_id.eq.${householdId}`)
      .eq("is_active", true),
  ]);

  const rules = (rulesResult.data ?? []) as RecurringRule[];
  const accounts = accountsResult.data ?? [];
  const categories = categoriesResult.data ?? [];

  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const activeRules = rules.filter((r) => r.is_active);
  const inactiveRules = rules.filter((r) => !r.is_active);

  // Calculate monthly impact
  const monthlyIncome = activeRules
    .filter((r) => r.template_json.type === "income" && r.frequency === "monthly")
    .reduce((sum, r) => sum + Number(r.template_json.amount), 0);
  const monthlyExpense = activeRules
    .filter((r) => r.template_json.type === "expense" && r.frequency === "monthly")
    .reduce((sum, r) => sum + Number(r.template_json.amount), 0);

  return (
    <AppShell
      header={<AppHeader title={t(language, "recurring.title")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Hero Card */}
        <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/5 via-white to-emerald-50/30">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Repeat className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-950">
                  {t(language, "recurring.title")}
                </h1>
                <p className="text-sm text-slate-600">
                  {t(language, "recurring.description")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="text-xs font-medium text-emerald-700">
                  {t(language, "recurring.monthly_income")}
                </p>
                <p className="text-lg font-bold text-emerald-900">
                  +{formatVndCompact(monthlyIncome, householdLocale)}
                </p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3">
                <p className="text-xs font-medium text-rose-700">
                  {t(language, "recurring.monthly_expense")}
                </p>
                <p className="text-lg font-bold text-rose-900">
                  -{formatVndCompact(monthlyExpense, householdLocale)}
                </p>
              </div>
            </div>

            <CreateRecurringDialog accounts={accounts} categories={categories} />
          </CardContent>
        </Card>

        {/* Active Rules */}
        <div className="space-y-4">
          <SectionHeader
            label="Active"
            title={t(language, "recurring.active")}
          />

          {rulesResult.error ? (
            <EmptyState
              icon={Repeat}
              title={t(language, "recurring.error_loading")}
              description={rulesResult.error.message}
              className="bg-destructive/5 border-destructive/20"
            />
          ) : activeRules.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={t(language, "recurring.no_rules")}
              description={t(language, "recurring.no_rules_desc")}
            />
          ) : (
            <RecurringRuleList
              rules={activeRules}
              accounts={accountMap}
              categories={categoryMap}
              locale={householdLocale}
              language={language}
            />
          )}
        </div>

        {/* Inactive Rules */}
        {inactiveRules.length > 0 && (
          <div className="space-y-4">
            <SectionHeader
              label="Paused"
              title={t(language, "recurring.paused")}
            />
            <RecurringRuleList
              rules={inactiveRules}
              accounts={accountMap}
              categories={categoryMap}
              locale={householdLocale}
              language={language}
            />
          </div>
        )}

        {/* Tips Card */}
        <Card className="border-dashed border-slate-300 bg-slate-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">
                {t(language, "recurring.tips")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
