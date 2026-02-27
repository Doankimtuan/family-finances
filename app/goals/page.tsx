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
import {
  formatDate,
  formatVnd,
  formatVndCompact,
} from "@/lib/dashboard/format";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
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
  const { householdId, language, householdLocale } =
    await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
  const supabase = await createClient();

  const [goalsResult, contributionsResult] = await Promise.all([
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
    <AppShell
      header={<AppHeader title={t(language, "goals.title")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="border-primary/20 bg-primary/5">
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
            <div className="grid grid-cols-1 gap-4">
              {goals.map((goal) => {
                const rows = contributionsByGoal.get(goal.id) ?? [];
                const funded = rows.reduce(
                  (sum, row) => sum + Number(row.amount),
                  0,
                );
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
                          (sum, row) => sum + Number(row.amount),
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
                      "overflow-hidden group transition-all duration-300",
                      paceStatus === "behind"
                        ? "border-warning/50 hover:border-warning"
                        : "hover:border-primary/30",
                    )}
                  >
                    <CardContent className="p-0">
                      {/* Hero Section: ETA Focus */}
                      <div
                        className={cn(
                          "p-5 pb-4 border-b",
                          paceStatus === "behind"
                            ? "bg-warning/5 border-warning/10"
                            : paceStatus === "on_track"
                              ? "bg-success/5 border-success/10"
                              : paceStatus === "completed"
                                ? "bg-primary/5 border-primary/10"
                                : "bg-muted/10 border-border/50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-bold text-foreground mb-1">
                              {goal.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              {paceStatus === "completed" ? (
                                <Badge
                                  variant="default"
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
                                  variant="warning"
                                  className="text-[10px] uppercase font-bold"
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
                              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                {goalTypeLabel}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              {formatVndCompact(funded, householdLocale)} /{" "}
                              {formatVndCompact(target, householdLocale)}
                            </p>
                            <p
                              className={cn(
                                "text-xl font-black leading-none",
                                paceStatus === "on_track" ||
                                  paceStatus === "completed"
                                  ? "text-success"
                                  : paceStatus === "behind"
                                    ? "text-warning"
                                    : "text-primary",
                              )}
                            >
                              {progressValue}%
                            </p>
                          </div>
                        </div>

                        {/* Actionable insight row */}
                        {paceStatus !== "completed" && (
                          <div className="pt-2 mt-2 border-t border-border/50">
                            {paceStatus === "behind" ? (
                              <p className="text-sm text-warning-foreground font-medium flex items-center">
                                {t(language, "goals.missed_by")} {overageMonths}{" "}
                                {t(language, "goals.months")}.{" "}
                                <br className="hidden sm:block" />
                                {neededExtraPerMonth > 0 && (
                                  <span className="ml-1 text-foreground">
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
                              <p className="text-sm text-success-foreground font-medium flex items-center">
                                {t(language, "goals.arriving")}{" "}
                                {formatDate(etaDate, householdLocale, {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                            ) : requiredMonthly && requiredMonthly > 0 ? (
                              <p className="text-sm text-muted-foreground font-medium flex items-center">
                                {formatVndCompact(
                                  requiredMonthly,
                                  householdLocale,
                                )}
                                /mo needed to hit target
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground font-medium flex items-center">
                                Add a consistent monthly contribution to see
                                your ETA.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="px-5 py-4 space-y-4">
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

                      <div className="pt-2 px-5 pb-5 bg-muted/5 border-t border-border/50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                          {vi ? "Thêm đóng góp" : "Add Towards Goal"}
                        </p>
                        <AddContributionForm goalId={goal.id} />
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
    <div className="rounded-xl border border-border bg-muted/5 p-3 transition-colors hover:bg-muted/10">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground/70" />
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="text-sm font-bold text-foreground truncate">{value}</p>
      <p className="text-[10px] text-muted-foreground/80 truncate font-medium">
        {sub}
      </p>
    </div>
  );
}
