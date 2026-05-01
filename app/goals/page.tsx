import { differenceInCalendarMonths } from "date-fns";
import { AddContributionForm } from "@/app/goals/_components/add-contribution-form";
import { CreateGoalForm } from "@/app/goals/_components/create-goal-form";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  formatDate,
  formatVnd,
  formatVndCompact,
} from "@/lib/dashboard/format";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { buildSavingsListItems, fetchSavingsBundle } from "@/lib/savings/service";
import { createClient } from "@/lib/supabase/server";
import {
  LucideIcon,
  Target,
  PlusCircle,
  Calendar,
  Wallet,
  TrendingUp,
  Info,
  Clock,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import { cn } from "@/lib/utils";

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
  id: string;
  goal_id: string;
  amount: number;
  contribution_date: string;
  flow_type: "inflow" | "outflow";
  source_account_id: string | null;
  destination_account_id: string | null;
  note: string | null;
};

function monthsUntil(date: string) {
  const now = new Date();
  const target = new Date(date);
  return Math.max(0, differenceInCalendarMonths(target, now));
}

export default async function GoalsPage() {
  const { householdId, language, householdLocale } =
    await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
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

  return (
    <AppShell
      header={<AppHeader title={t(language, "goals.title")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader>
            <SectionHeader
              label="Planning"
              title={vi ? "Tạo mục tiêu" : "Create Goal"}
              description={
                vi
                  ? "Biến kế hoạch tiết kiệm thành lộ trình cụ thể của gia đình."
                  : "Turn abstract saving into a concrete household timeline."
              }
            />
          </CardHeader>
          <CardContent>
            <CreateGoalForm />
          </CardContent>
        </Card>

        <section className="space-y-4">
          <SectionHeader
            label="Track"
            title={vi ? "Tiến độ mục tiêu" : "Active Goal Progress"}
          />

          {goalsResult.error || contributionsResult.error ? (
            <EmptyState
              icon={Target}
              title="Error loading goals"
              description={
                vi
                  ? "Không thể tải dữ liệu mục tiêu."
                  : "Could not load goals data."
              }
              className="bg-destructive/5 border-destructive/20"
            />
          ) : goals.length === 0 ? (
            <EmptyState
              icon={PlusCircle}
              title={vi ? "Chưa có mục tiêu" : "No goals yet"}
              description={
                vi
                  ? "Bắt đầu với một mục tiêu quan trọng và thêm khoản đóng góp đầu tiên ngay hôm nay."
                  : "Start with one meaningful goal and add your first contribution today."
              }
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
                const funded = rows.reduce(
                  (sum, row) => sum + (row.flow_type === "outflow" ? -Number(row.amount) : Number(row.amount)),
                  0,
                ) + savingsLinkedValue;
                const target = Number(goal.target_amount);
                const progressValue =
                  target > 0
                    ? Math.max(
                        0,
                        Math.min(100, Math.round((funded / target) * 100)),
                      )
                    : 0;
                const remaining = Math.max(0, target - funded);

                const monthlyWindow = goal.target_date
                  ? Math.max(1, monthsUntil(goal.target_date))
                  : null;
                const requiredMonthly = monthlyWindow
                  ? Math.ceil(remaining / monthlyWindow)
                  : null;

                const sixMonthAgo = new Date();
                sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);
                const recentContrib = rows.filter(
                  (row) => new Date(row.contribution_date) >= sixMonthAgo,
                );
                const avgMonthlyContribution =
                  recentContrib.length > 0
                    ? Math.round(
                        recentContrib.reduce(
                          (sum, row) => sum + (row.flow_type === "outflow" ? -Number(row.amount) : Number(row.amount)),
                          0,
                        ) / 6,
                      )
                    : 0;

                const etaMonths =
                  avgMonthlyContribution > 0
                    ? Math.ceil(remaining / avgMonthlyContribution)
                    : null;
                const etaDate =
                  etaMonths !== null
                    ? new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() + etaMonths,
                        1,
                      )
                    : null;

                const goalTypeLabel = goal.goal_type.replace(/_/g, " ");

                // Determine Health / Pace status
                let paceStatus:
                  | "on_track"
                  | "behind"
                  | "no_deadline"
                  | "completed" = "no_deadline";
                let overageMonths = 0;
                let neededExtraPerMonth = 0;

                if (goal.status === "completed") {
                  paceStatus = "completed";
                } else if (goal.target_date) {
                  if (etaMonths !== null && monthlyWindow !== null) {
                    if (etaMonths <= monthlyWindow) {
                      paceStatus = "on_track";
                    } else {
                      paceStatus = "behind";
                      overageMonths = etaMonths - monthlyWindow;
                      neededExtraPerMonth =
                        requiredMonthly !== null
                          ? requiredMonthly - avgMonthlyContribution
                          : 0;
                    }
                  } else if (
                    remaining > 0 &&
                    monthlyWindow !== null &&
                    monthlyWindow < 3
                  ) {
                    // Very close but no recent contributions
                    paceStatus = "behind";
                    neededExtraPerMonth = requiredMonthly ?? 0;
                  }
                }

                return (
                  <Card
                    key={goal.id}
                    className={cn(
                      "overflow-hidden group transition-all duration-300 shadow-sm",
                      paceStatus === "behind"
                        ? "border-rose-200 hover:border-rose-300"
                        : "hover:border-primary/30",
                    )}
                  >
                    <CardContent className="p-0">
                      {/* Hero Section: ETA Focus */}
                      <div
                        className={cn(
                          "p-5 pb-4 border-b",
                          paceStatus === "behind"
                            ? "bg-rose-50 border-rose-100"
                            : paceStatus === "on_track"
                              ? "bg-emerald-50 border-emerald-100"
                              : paceStatus === "completed"
                                ? "bg-primary/5 border-primary/10"
                                : "bg-slate-50 border-slate-100",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-bold text-slate-900 mb-1">
                              {goal.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              {paceStatus === "completed" ? (
                                <Badge
                                  className="bg-primary/20 text-primary hover:bg-primary/20 border-transparent text-[10px] uppercase font-bold"
                                >
                                  <Sparkles className="mr-1 h-3 w-3" />
                                  {t(language, "goals.completed")}
                                </Badge>
                              ) : paceStatus === "on_track" ? (
                                <Badge
                                  variant="success"
                                  className="text-[10px] uppercase font-bold"
                                >
                                  <TrendingUp className="mr-1 h-3 w-3" />
                                  {t(language, "goals.on_track")}
                                </Badge>
                              ) : paceStatus === "behind" ? (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px] uppercase font-bold bg-rose-100 text-rose-700 hover:bg-rose-100 border-transparent"
                                >
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  {t(language, "goals.behind")}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] uppercase font-bold"
                                >
                                  <Clock className="mr-1 h-3 w-3" />
                                  {t(language, "goals.no_deadline")}
                                </Badge>
                              )}
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                {goalTypeLabel}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                              {formatVndCompact(funded, householdLocale)} /{" "}
                              {formatVndCompact(target, householdLocale)}
                            </p>
                            <p
                              className={cn(
                                "text-2xl font-black leading-none",
                                paceStatus === "on_track" ||
                                  paceStatus === "completed"
                                  ? "text-emerald-600"
                                  : paceStatus === "behind"
                                    ? "text-rose-600"
                                    : "text-slate-900",
                              )}
                            >
                              {progressValue}%
                            </p>
                          </div>
                        </div>

                        {/* Actionable insight row */}
                        {paceStatus !== "completed" && (
                          <div className="pt-2 mt-2 border-t border-slate-200/50">
                            {paceStatus === "behind" ? (
                              <p className="text-sm text-rose-700 font-medium flex items-center">
                                {t(language, "goals.missed_by")} {overageMonths}{" "}
                                {t(language, "goals.months")}.{" "}
                                <br className="hidden sm:block" />
                                {neededExtraPerMonth > 0 && (
                                  <span className="ml-1 text-slate-900">
                                    +{" "}
                                    {formatVndCompact(
                                      neededExtraPerMonth,
                                      householdLocale,
                                    )}{" "}
                                    {t(language, "goals.add_per_month")}
                                  </span>
                                )}
                              </p>
                            ) : paceStatus === "on_track" && etaDate ? (
                              <p className="text-sm text-emerald-700 font-medium flex items-center">
                                {t(language, "goals.arriving")}{" "}
                                {formatDate(etaDate, householdLocale, {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                            ) : requiredMonthly && requiredMonthly > 0 ? (
                              <p className="text-sm text-slate-600 font-medium flex items-center">
                                {formatVndCompact(
                                  requiredMonthly,
                                  householdLocale,
                                )}
                                /mo needed to hit target
                              </p>
                            ) : (
                              <p className="text-sm text-slate-500 font-medium flex items-center">
                                Add a consistent monthly contribution to see
                                your ETA.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="px-5 py-5 space-y-5">
                        <Progress
                          value={progressValue}
                          variant={
                            progressValue > 90
                              ? "success"
                              : paceStatus === "behind"
                                ? "warning"
                                : "default"
                          }
                          className="h-2 shadow-xs"
                        />

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <GoalStat
                            label={vi ? "Đã góp" : "Funded"}
                            value={formatVndCompact(funded, householdLocale)}
                            sub={formatVnd(funded, householdLocale)}
                            icon={Wallet}
                          />
                          <GoalStat
                            label={vi ? "Còn thiếu" : "To Go"}
                            value={formatVndCompact(remaining, householdLocale)}
                            sub={formatVnd(remaining, householdLocale)}
                            icon={TrendingUp}
                          />
                          <GoalStat
                            label={vi ? "Mục tiêu/th" : "Goal/Mo"}
                            value={
                              requiredMonthly !== null
                                ? formatVndCompact(
                                    requiredMonthly,
                                    householdLocale,
                                  )
                                : "-"
                            }
                            sub={
                              goal.target_date
                                ? `${t(language, "common.to")} ${formatDate(goal.target_date, householdLocale)}`
                                : "No deadline"
                            }
                            icon={Calendar}
                          />
                          <GoalStat
                            label="ETA"
                            value={
                              etaDate
                                ? formatDate(etaDate, householdLocale, {
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "-"
                            }
                            sub={
                              avgMonthlyContribution > 0
                                ? `avg ${formatVndCompact(avgMonthlyContribution, householdLocale)}/mo`
                                : "No history"
                            }
                            icon={Info}
                          />
                        </div>
                      </div>

                      <div className="px-5 py-5 bg-slate-50/50 border-t border-slate-100 space-y-4">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                          {vi ? "Quản lý dòng tiền mục tiêu" : "Manage Goal Cash Flows"}
                        </Label>
                        <AddContributionForm
                          goalId={goal.id}
                          goalName={goal.name}
                          accounts={accounts.map((account) => ({ id: account.id, name: account.name }))}
                        />
                        
                        {rows.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              {vi ? "Lịch sử gần đây" : "Recent History"}
                            </Label>
                            <ul className="space-y-2">
                              {rows.slice(0, 3).map((row) => {
                                const source = row.flow_type === "inflow"
                                  ? (row.source_account_id ? accountMap.get(row.source_account_id) ?? (vi ? "Tài khoản không xác định" : "Unknown account") : (vi ? "Tài khoản không xác định" : "Unknown account"))
                                  : goal.name;
                                const destination = row.flow_type === "inflow"
                                  ? goal.name
                                  : (row.destination_account_id ? accountMap.get(row.destination_account_id) ?? (vi ? "Tài khoản không xác định" : "Unknown account") : (vi ? "Tài khoản không xác định" : "Unknown account"));

                                return (
                                  <li key={row.id} className="rounded-xl border border-slate-200/60 bg-white p-3 shadow-sm transition-all hover:border-slate-300">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                                        <span className="truncate max-w-[100px]">{source}</span>
                                        <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                                        <span className="truncate max-w-[100px]">{destination}</span>
                                      </div>
                                      <span className={cn(
                                        "text-xs font-bold",
                                        row.flow_type === "outflow" ? "text-rose-600" : "text-emerald-600"
                                      )}>
                                        {row.flow_type === "outflow" ? "-" : "+"}{formatVndCompact(Number(row.amount), householdLocale)}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                      <p className="text-[10px] font-medium text-slate-500">
                                        {formatDate(row.contribution_date, householdLocale)}
                                      </p>
                                      {row.note && (
                                        <p className="text-[10px] italic text-slate-400 truncate max-w-[150px]">
                                          {row.note}
                                        </p>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function GoalStat({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-primary/20 hover:bg-slate-50/30">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
      </div>
      <p className="text-sm font-bold text-slate-900 truncate">{value}</p>
      <p className="mt-1 text-[10px] text-slate-500 truncate font-medium">
        {sub}
      </p>
    </div>
  );
}
