import {
  LucideIcon,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Clock,
  Wallet,
  Calendar,
  Info,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  formatDate,
  formatVnd,
  formatVndCompact,
} from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import { AddContributionForm } from "./add-contribution-form";
import { VALIDATION } from "../_lib/constants";
import type { GoalRow, GoalStats, AccountOption } from "../_lib/types";

interface GoalCardProps {
  goal: GoalRow;
  contributions: any[];
  stats: GoalStats;
  accounts: AccountOption[];
  accountMap: Map<string, string>;
}

export function GoalCard({
  goal,
  contributions,
  stats,
  accounts,
  accountMap,
}: GoalCardProps) {
  const { t, locale } = useI18n();
  const goalTypeLabel = goal.goal_type.replace(/_/g, " ");

  return (
    <Card
      className={cn(
        "overflow-hidden group transition-all duration-300 shadow-sm",
        stats.paceStatus === "behind"
          ? "border-rose-200 hover:border-rose-300"
          : "hover:border-primary/30",
      )}
    >
      <CardContent className="p-0">
        <GoalCardHeader
          goal={goal}
          goalTypeLabel={goalTypeLabel}
          stats={stats}
        />
        <GoalCardBody stats={stats} goal={goal} />
        <GoalCardFooter
          goal={goal}
          contributions={contributions}
          accounts={accounts}
          accountMap={accountMap}
        />
      </CardContent>
    </Card>
  );
}

function GoalCardHeader({
  goal,
  goalTypeLabel,
  stats,
}: {
  goal: GoalRow;
  goalTypeLabel: string;
  stats: GoalStats;
}) {
  const { t, locale } = useI18n();

  return (
    <div
      className={cn(
        "p-5 pb-4 border-b",
        stats.paceStatus === "behind"
          ? "bg-rose-50 border-rose-100"
          : stats.paceStatus === "on_track"
            ? "bg-emerald-50 border-emerald-100"
            : stats.paceStatus === "completed"
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
            <PaceBadge paceStatus={stats.paceStatus} />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {goalTypeLabel}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            {formatVndCompact(stats.funded, locale)} /{" "}
            {formatVndCompact(stats.target, locale)}
          </p>
          <p
            className={cn(
              "text-2xl font-black leading-none",
              stats.paceStatus === "on_track" || stats.paceStatus === "completed"
                ? "text-emerald-600"
                : stats.paceStatus === "behind"
                  ? "text-rose-600"
                  : "text-slate-900",
            )}
          >
            {stats.progressValue}%
          </p>
        </div>
      </div>
      <PaceInsight stats={stats} />
    </div>
  );
}

function PaceBadge({ paceStatus }: { paceStatus: string }) {
  const { t } = useI18n();

  const badges = {
    completed: (
      <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border-transparent text-[10px] uppercase font-bold">
        <Sparkles className="mr-1 h-3 w-3" />
        {t("goals.completed")}
      </Badge>
    ),
    on_track: (
      <Badge
        variant="success"
        className="text-[10px] uppercase font-bold"
      >
        <TrendingUp className="mr-1 h-3 w-3" />
        {t("goals.on_track")}
      </Badge>
    ),
    behind: (
      <Badge
        variant="destructive"
        className="text-[10px] uppercase font-bold bg-rose-100 text-rose-700 hover:bg-rose-100 border-transparent"
      >
        <AlertCircle className="mr-1 h-3 w-3" />
        {t("goals.behind")}
      </Badge>
    ),
    no_deadline: (
      <Badge
        variant="secondary"
        className="text-[10px] uppercase font-bold"
      >
        <Clock className="mr-1 h-3 w-3" />
        {t("goals.no_deadline")}
      </Badge>
    ),
  };

  return badges[paceStatus as keyof typeof badges] || badges.no_deadline;
}

function PaceInsight({ stats }: { stats: GoalStats }) {
  const { t, locale } = useI18n();

  if (stats.paceStatus === "completed") return null;

  return (
    <div className="pt-2 mt-2 border-t border-slate-200/50">
      {stats.paceStatus === "behind" ? (
        <p className="text-sm text-rose-700 font-medium flex items-center">
          {t("goals.missed_by")} {stats.overageMonths}{" "}
          {t("goals.months")}.{" "}
          <br className="hidden sm:block" />
          {stats.neededExtraPerMonth > 0 && (
            <span className="ml-1 text-slate-900">
              +{" "}
              {formatVndCompact(stats.neededExtraPerMonth, locale)}{" "}
              {t("goals.add_per_month")}
            </span>
          )}
        </p>
      ) : stats.paceStatus === "on_track" && stats.etaDate ? (
        <p className="text-sm text-emerald-700 font-medium flex items-center">
          {t("goals.arriving")}{" "}
          {formatDate(stats.etaDate, locale, {
            month: "long",
            year: "numeric",
          })}
        </p>
      ) : stats.requiredMonthly && stats.requiredMonthly > 0 ? (
        <p className="text-sm text-slate-600 font-medium flex items-center">
          {formatVndCompact(stats.requiredMonthly, locale)}
          /mo needed to hit target
        </p>
      ) : (
        <p className="text-sm text-slate-500 font-medium flex items-center">
          Add a consistent monthly contribution to see your ETA.
        </p>
      )}
    </div>
  );
}

function GoalCardBody({ stats, goal }: { stats: GoalStats; goal: GoalRow }) {
  const { t, locale } = useI18n();

  return (
    <div className="px-5 py-5 space-y-5">
      <Progress
        value={stats.progressValue}
        variant={
          stats.progressValue > 90
            ? "success"
            : stats.paceStatus === "behind"
              ? "warning"
              : "default"
        }
        className="h-2 shadow-xs"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GoalStat
          label={t("goals.stats.funded")}
          value={formatVndCompact(stats.funded, locale)}
          sub={formatVnd(stats.funded, locale)}
          icon={Wallet}
        />
        <GoalStat
          label={t("goals.stats.to_go")}
          value={formatVndCompact(stats.remaining, locale)}
          sub={formatVnd(stats.remaining, locale)}
          icon={TrendingUp}
        />
        <GoalStat
          label={t("goals.stats.goal_per_month")}
          value={
            stats.requiredMonthly !== null
              ? formatVndCompact(stats.requiredMonthly, locale)
              : "-"
          }
          sub={
            goal.target_date
              ? `${t("common.to")} ${formatDate(goal.target_date, locale)}`
              : t("goals.stats.no_deadline")
          }
          icon={Calendar}
        />
        <GoalStat
          label="ETA"
          value={
            stats.etaDate
              ? formatDate(stats.etaDate, locale, {
                  month: "short",
                  year: "numeric",
                })
              : "-"
          }
          sub={
            stats.avgMonthlyContribution > 0
              ? `avg ${formatVndCompact(stats.avgMonthlyContribution, locale)}/mo`
              : t("goals.stats.no_history")
          }
          icon={Info}
        />
      </div>
    </div>
  );
}

function GoalCardFooter({
  goal,
  contributions,
  accounts,
  accountMap,
}: {
  goal: GoalRow;
  contributions: any[];
  accounts: AccountOption[];
  accountMap: Map<string, string>;
}) {
  const { t, locale } = useI18n();

  return (
    <div className="px-5 py-5 bg-slate-50/50 border-t border-slate-100 space-y-4">
      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
        {t("goals.manage_cash_flows")}
      </Label>
      <AddContributionForm
        goalId={goal.id}
        goalName={goal.name}
        accounts={accounts}
      />
      {contributions.length > 0 && (
        <div className="space-y-2 pt-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {t("goals.recent_history")}
          </Label>
          <ul className="space-y-2">
            {contributions.slice(0, VALIDATION.MAX_HISTORY_ITEMS).map((row) => {
              const source = row.flow_type === "inflow"
                ? (row.source_account_id ? accountMap.get(row.source_account_id) ?? t("goals.unknown_account") : t("goals.unknown_account"))
                : goal.name;
              const destination = row.flow_type === "inflow"
                ? goal.name
                : (row.destination_account_id ? accountMap.get(row.destination_account_id) ?? t("goals.unknown_account") : t("goals.unknown_account"));

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
                      {row.flow_type === "outflow" ? "-" : "+"}{formatVndCompact(Number(row.amount), locale)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[10px] font-medium text-slate-500">
                      {formatDate(row.contribution_date, locale)}
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
