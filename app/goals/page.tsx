import { differenceInCalendarMonths } from "date-fns";

import { AddContributionForm } from "@/app/goals/_components/add-contribution-form";
import { CreateGoalForm } from "@/app/goals/_components/create-goal-form";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { formatVnd, formatVndCompact } from "@/lib/dashboard/format";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Goals | Family Finances",
};

type GoalRow = {
  id: string;
  name: string;
  goal_type: string;
  target_amount: number;
  target_date: string | null;
  start_date: string;
  priority: number;
  status: string;
};

type ContributionRow = {
  goal_id: string;
  amount: number;
  contribution_date: string;
};

function monthsUntil(date: string) {
  const now = new Date();
  const target = new Date(date);
  return Math.max(0, differenceInCalendarMonths(target, now));
}

export default async function GoalsPage() {
  const { householdId } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const [goalsResult, contributionsResult] = await Promise.all([
    supabase
      .from("goals")
      .select("id, name, goal_type, target_amount, target_date, start_date, priority, status")
      .eq("household_id", householdId)
      .in("status", ["active", "paused", "completed"])
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("goal_contributions")
      .select("goal_id, amount, contribution_date")
      .eq("household_id", householdId)
      .order("contribution_date", { ascending: false }),
  ]);

  const goals = (goalsResult.data ?? []) as GoalRow[];
  const contributions = (contributionsResult.data ?? []) as ContributionRow[];

  const contributionsByGoal = new Map<string, ContributionRow[]>();
  for (const row of contributions) {
    const current = contributionsByGoal.get(row.goal_id) ?? [];
    current.push(row);
    contributionsByGoal.set(row.goal_id, current);
  }

  return (
    <AppShell header={<AppHeader title="Financial Goals" />} footer={<BottomTabBar />}>
      <div className="space-y-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create Goal</h2>
          <p className="mt-1 text-sm text-slate-600">Turn abstract saving into a concrete household timeline.</p>
          <div className="mt-4">
            <CreateGoalForm />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Active Goal Progress</h2>
          {goalsResult.error || contributionsResult.error ? (
            <p className="mt-2 text-sm text-rose-600">Could not load goals data.</p>
          ) : goals.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-800">No goals yet.</p>
              <p className="mt-1 text-sm text-slate-600">Start with one meaningful goal and add your first contribution today.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {goals.map((goal) => {
                const rows = contributionsByGoal.get(goal.id) ?? [];
                const funded = rows.reduce((sum, row) => sum + Number(row.amount), 0);
                const target = Number(goal.target_amount);
                const progress = target > 0 ? Math.max(0, Math.min(100, Math.round((funded / target) * 100))) : 0;
                const remaining = Math.max(0, target - funded);

                const monthlyWindow = goal.target_date ? Math.max(1, monthsUntil(goal.target_date)) : null;
                const requiredMonthly = monthlyWindow ? Math.ceil(remaining / monthlyWindow) : null;

                const sixMonthAgo = new Date();
                sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);
                const recentContrib = rows.filter((row) => new Date(row.contribution_date) >= sixMonthAgo);
                const avgMonthlyContribution = recentContrib.length > 0
                  ? Math.round(recentContrib.reduce((sum, row) => sum + Number(row.amount), 0) / 6)
                  : 0;

                const etaMonths = avgMonthlyContribution > 0 ? Math.ceil(remaining / avgMonthlyContribution) : null;
                const etaDate = etaMonths !== null
                  ? new Date(new Date().getFullYear(), new Date().getMonth() + etaMonths, 1)
                  : null;

                return (
                  <li key={goal.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{goal.name}</p>
                        <p className="text-xs text-slate-500">
                          {goal.goal_type.replace(/_/g, " ")} · Priority {goal.priority} · {goal.status}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{progress}%</p>
                    </div>

                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-teal-600" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                      <Stat label="Funded" value={formatVndCompact(funded)} sub={formatVnd(funded)} />
                      <Stat label="Remaining" value={formatVndCompact(remaining)} sub={formatVnd(remaining)} />
                      <Stat
                        label="Required / Month"
                        value={requiredMonthly !== null ? formatVndCompact(requiredMonthly) : "-"}
                        sub={goal.target_date ? `to ${new Date(goal.target_date).toLocaleDateString("en-US")}` : "No target date"}
                      />
                      <Stat
                        label="ETA"
                        value={etaDate ? etaDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "-"}
                        sub={avgMonthlyContribution > 0 ? `avg ${formatVndCompact(avgMonthlyContribution)}/mo` : "Need contributions history"}
                      />
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Add Contribution</p>
                      <AddContributionForm goalId={goal.id} />
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

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      <p className="text-[10px] text-slate-500">{sub}</p>
    </div>
  );
}
