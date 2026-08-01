import Link from "next/link";
import { CreateGoalForm } from "@/app/goals/_components/create-goal-form";
import { JarsTab } from "@/app/goals/_components/jars-tab";
import { GoalsPageClient } from "@/app/goals/_components/goals-page-client";
import { GoalCard } from "@/app/goals/_components/goal-card";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Target, PlusCircle } from "lucide-react";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { buildSavingsListItems, fetchSavingsBundle } from "@/lib/savings/service";
import { createClient } from "@/lib/supabase/server";
import { calculateGoalStats } from "@/app/goals/_lib/calculations";
import type { GoalRow, ContributionRow, AccountOption } from "@/app/goals/_lib/types";

export const metadata = {
  title: "Goals | Family Finances",
};

export default async function GoalsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; month?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const activeTab = params?.tab === "jars" ? "jars" : "goals";
  const month = params?.month;

  const { householdId, language, householdLocale } =
    await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const [goalsResult, contributionsResult, accountsResult] = await Promise.all([
    supabase
      .from("goals")
      .select(
        "id, name, goal_type, target_amount, target_date, start_date, priority, status",
      )
      .eq("household_id", householdId)
      .in("status", ["active", "paused", "completed"])
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("goal_contributions")
      .select("id, goal_id, amount, contribution_date, flow_type, source_account_id, destination_account_id, note")
      .eq("household_id", householdId)
      .order("contribution_date", { ascending: false }),
    supabase
      .from("accounts")
      .select("id, name")
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
  ]);

  const goals = (goalsResult.data ?? []) as GoalRow[];
  const contributions = (contributionsResult.data ?? []) as ContributionRow[];
  const accounts = accountsResult.data ?? [];
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const savingsBundle = await fetchSavingsBundle(supabase, householdId);
  const savingsItems = buildSavingsListItems(
    savingsBundle.accounts,
    savingsBundle.withdrawals,
    savingsBundle.goals,
    new Date().toISOString().slice(0, 10),
  );

  const contributionsByGoal = new Map<string, ContributionRow[]>();
  for (const row of contributions) {
    const current = contributionsByGoal.get(row.goal_id) ?? [];
    current.push(row);
    contributionsByGoal.set(row.goal_id, current);
  }

  const accountOptions: AccountOption[] = accounts.map((account) => ({
    id: account.id,
    name: account.name,
  }));

  return (
    <AppShell
      header={<AppHeader title={t(language, "goals.title")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <GoalsPageClient
          initialTab={activeTab}
          goalsContent={
            <>
              <Card className="border-primary/20 bg-primary/5 shadow-sm">
                <CardHeader>
                  <SectionHeader
                    label="Planning"
                    title={t(language, "goals.create_goal_title")}
                    description={t(language, "goals.create_goal_description")}
                  />
                </CardHeader>
                <CardContent>
                  <CreateGoalForm />
                </CardContent>
              </Card>

              <section className="space-y-4">
                <SectionHeader
                  label="Track"
                  title={t(language, "goals.active_progress_title")}
                />

                {goalsResult.error || contributionsResult.error ? (
                  <EmptyState
                    icon={Target}
                    title={t(language, "goals.error_loading")}
                    description={t(language, "goals.error_loading_description")}
                    className="bg-destructive/5 border-destructive/20"
                  />
                ) : goals.length === 0 ? (
                  <EmptyState
                    icon={PlusCircle}
                    title={t(language, "goals.no_goals_title")}
                    description={t(language, "goals.no_goals_description")}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {goals.map((goal) => {
                      const rows = contributionsByGoal.get(goal.id) ?? [];
                      const savingsLinkedValue = savingsItems
                        .filter((item) => item.goalId === goal.id)
                        .reduce(
                          (sum, item) => sum + item.currentValue.grossValue,
                          0,
                        );
                      const stats = calculateGoalStats(goal, rows, savingsLinkedValue);

                      return (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          contributions={rows}
                          stats={stats}
                          accounts={accountOptions}
                          accountMap={accountMap}
                        />
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          }
          jarsContent={<JarsTab month={month} />}
        />
      </div>
    </AppShell>
  );
}
