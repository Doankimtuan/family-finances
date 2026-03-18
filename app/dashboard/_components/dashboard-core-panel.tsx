"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import {
  HeartPulse,
  Sparkles,
  Info,
  History,
  Wallet,
  Activity,
  Target,
  Zap,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  AlertCircle,
  Receipt,
} from "lucide-react";
import { t as tFn } from "@/lib/i18n/dictionary";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  formatMonths,
  formatPercent,
  formatVnd,
  formatVndCompact,
} from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import type { DashboardCoreResponse } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/config/features";
import { MaturityTimelineWidget } from "./maturity-timeline-widget";

const NetWorthTrend = dynamic(
  () => import("./dashboard-charts").then((mod) => mod.NetWorthTrend),
  { ssr: false },
);

const MonthlyExpenseAllocation = dynamic(
  () =>
    import("./dashboard-charts").then((mod) => mod.MonthlyExpenseAllocation),
  { ssr: false },
);

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardCorePanel() {
  const { locale, language } = useI18n();
  const vi = language === "vi";
  const jarsEnabled = isFeatureEnabled("jars");
  const financialHealthEnabled = isFeatureEnabled("financialHealth");

  const {
    data: payload,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DashboardCoreResponse>({
    queryKey: ["dashboard-core"],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/core?months=6`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorBody?.error ?? `Request failed with status ${response.status}`,
        );
      }

      return (await response.json()) as DashboardCoreResponse;
    },
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <section className="space-y-6" aria-busy="true">
        <Skeleton className="h-48 rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={HeartPulse}
        title={vi ? "Trục trặc kỹ thuật" : "Technical issue"}
        description={error instanceof Error ? error.message : "Unknown error"}
        action={
          <Button onClick={() => void refetch()} variant="outline" size="sm">
            {vi ? "Thử lại" : "Retry"}
          </Button>
        }
        className="border-destructive/20 bg-destructive/5"
      />
    );
  }

  if (!payload || !payload.metrics) {
    return (
      <EmptyState
        icon={Sparkles}
        title={
          vi
            ? "Ảnh chụp tài chính đầu tiên đang chờ"
            : "First clarity snapshot waiting"
        }
        description={
          vi
            ? "Bổ sung đủ tài khoản, chi tiêu và nợ/tài sản để kích hoạt bức tranh gia đình trọn vẹn."
            : "Add accounts, expenses, and debts/assets to activate the full household picture."
        }
        action={
          <Button asChild size="sm">
            <Link href="/accounts">{vi ? "Bắt đầu ngay" : "Get Started"}</Link>
          </Button>
        }
      />
    );
  }

  const { metrics, trend } = payload;
  const score = payload.health?.overallScore ?? 0;
  const topActionKey = payload.health?.topAction ?? "health.action.no_data";
  const displayAction = tFn(
    language,
    topActionKey.startsWith("health.action.")
      ? topActionKey
      : "health.action.no_data",
  );

  const savingsRateMomDeltaRaw = Number(metrics.savings_rate_mom_delta);
  const savingsRateMomDeltaPct = Number.isFinite(savingsRateMomDeltaRaw)
    ? Number((savingsRateMomDeltaRaw * 100).toFixed(1))
    : null;
  const savingsRateAvgLabel = vi ? "TB 6T" : "6-mo avg";
  const tdsrValue = Number(metrics.tdsr_percent);
  const hasTdsr = Number.isFinite(tdsrValue);
  const tdsrLabel = !hasTdsr
    ? (vi ? "Chưa đủ dữ liệu" : "No data")
    : tdsrValue > 50
      ? (vi ? "Rủi ro cao" : "High")
      : tdsrValue >= 35
        ? (vi ? "Cần theo dõi" : "Watch")
        : (vi ? "Bình thường" : "Normal");
  const tdsrVariant: "default" | "success" | "destructive" | "warning" =
    !hasTdsr
      ? "default"
      : tdsrValue > 50
        ? "destructive"
        : tdsrValue >= 35
          ? "warning"
          : "success";

  return (
    <section className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* ── 1. Hero Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary to-blue-700 p-8 shadow-xl hover:scale-[1.005] transition-all duration-500 cursor-pointer group">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute -left-4 bottom-0 w-24 h-24 bg-white/5 rounded-full" />
        <Link href="/money" className="block relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">
            {vi ? "Tài sản ròng" : "Net Worth"}
          </p>
          <p className="text-4xl font-bold text-white tracking-tight">
            {formatVndCompact(Number(metrics.net_worth), locale)}
          </p>
          <p className="text-sm text-white/70 mt-1">
            {formatVnd(Number(metrics.net_worth), locale)}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white">
              {vi ? "Điểm tài chính" : "Health Score"}: {score.toFixed(0)}/100
            </span>
            <span className="text-white/60 text-xs">
              {vi ? "Dự phòng" : "EM"}{" "}
              {formatMonths(metrics.emergency_months, locale)} · DSR{" "}
              {formatPercent(metrics.debt_service_ratio)}
            </span>
          </div>
        </Link>
      </div>

      {/* ── 2. 2×2 Metrics Grid ── */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label={vi ? "Thu nhập" : "Income"}
          value={formatVndCompact(Number(metrics.monthly_income), locale)}
          variant="success"
          className="bg-card shadow-sm border-border/50"
        />
        <MetricCard
          label={vi ? "Chi tiêu" : "Spending"}
          value={formatVndCompact(Number(metrics.monthly_expense), locale)}
          variant="destructive"
          className="bg-card shadow-sm border-border/50"
        />
        <MetricCard
          label={vi ? "Tỷ lệ tiết kiệm" : "Savings Rate"}
          value={formatPercent(metrics.savings_rate)}
          href="/transactions"
          className="bg-card shadow-sm border-border/50"
          note={`${savingsRateAvgLabel}: ${formatPercent(metrics.savings_rate_6mo_avg)}`}
          trend={
            savingsRateMomDeltaPct !== null
              ? {
                  value: savingsRateMomDeltaPct,
                  label: vi ? "vs tháng trước" : "vs last mo",
                }
              : undefined
          }
        />
        <MetricCard
          label={vi ? "Tỷ lệ nợ/TN (TDSR)" : "Debt/Income (TDSR)"}
          value={hasTdsr ? `${tdsrValue.toFixed(1)}%` : "-"}
          note={tdsrLabel}
          variant={tdsrVariant}
          className="bg-card shadow-sm border-border/50"
        />
      </div>

      {/* ── 3. Charts ── */}
      <div className="space-y-6">
        <NetWorthTrend trend={trend} locale={locale} vi={vi} />
        <MonthlyExpenseAllocation
          expenseRows={payload.drilldowns?.cashFlow.expense ?? []}
          vi={vi}
          locale={locale}
        />
      </div>

      {/* ── 4. Goals Snapshot ── */}
      {payload.goals && payload.goals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {vi ? "Mục tiêu tài chính" : "Financial Goals"}
            </h2>
            <Link
              href="/goals"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              {vi ? "Tất cả" : "View All"}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
            {payload.goals.map((goal) => {
              const pct = Math.min(
                100,
                Math.round((goal.current_amount / goal.target_amount) * 100),
              );
              return (
                <Card
                  key={goal.id}
                  className="min-w-[230px] shrink-0 border-border/50 hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm truncate">{goal.name}</p>
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {formatVndCompact(goal.current_amount, locale)} /{" "}
                      {formatVndCompact(goal.target_amount, locale)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 5. Jars Snapshot ── */}
      <MaturityTimelineWidget />

      {/* ── 5. Jars Snapshot ── */}
      {jarsEnabled && payload.jars && payload.jars.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              {vi ? "Hũ cần bổ sung" : "Underfunded Jars"}
            </h2>
            <Link
              href="/jars"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              {vi ? "Mở hũ" : "Open Jars"}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {payload.jars.map((jar) => {
              const coverage = Math.round(jar.coverage_ratio * 100);
              return (
                <Card key={jar.jar_id} className="border-border/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{jar.name}</p>
                      <p className="text-xs text-muted-foreground">{coverage}%</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, coverage))}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {formatVndCompact(jar.net_amount, locale)} /{" "}
                        {formatVndCompact(jar.target_amount, locale)}
                      </span>
                      <Link href="/jars" className="text-primary hover:underline">
                        {vi ? "Phân bổ" : "Allocate"}
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 6. Priority Actions ── */}
      {jarsEnabled && payload.spendingJarAlerts && payload.spendingJarAlerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              {vi ? "Cảnh báo chi tiêu theo hũ" : "Spending Jar Alerts"}
            </h2>
            <Link
              href="/jars"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              {vi ? "Mở hũ" : "Open Jars"}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {payload.spendingJarAlerts.map((alert) => (
              <Card key={alert.jarId} className="border-border/50">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{alert.jarName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatVndCompact(alert.spent, locale)} /{" "}
                      {formatVndCompact(alert.limit, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        alert.alertLevel === "exceeded"
                          ? "bg-rose-100 text-rose-700 border-rose-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      }
                    >
                      {alert.alertLevel === "exceeded"
                        ? (vi ? "Vượt hạn mức" : "Exceeded")
                        : (vi ? "Sắp chạm hạn mức" : "Warning")}
                    </Badge>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {alert.usagePercent === null
                        ? "—"
                        : `${alert.usagePercent.toFixed(1)}%`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. Priority Actions ── */}
      {payload.priorityActions && payload.priorityActions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            <h2 className="text-xl font-bold">
              {vi ? "Cần làm ngay" : "Priority Actions"}
            </h2>
          </div>
          <div className="space-y-3">
            {payload.priorityActions.map((action) => (
              <Card
                key={action.id}
                className="border-orange-200/60 bg-orange-50/50 dark:border-orange-900/30 dark:bg-orange-950/20 hover:border-orange-300 transition-colors cursor-pointer group"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm shrink-0">
                    <CreditCard className="h-5 w-5 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">
                      {action.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {action.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-foreground">
                      {formatVndCompact(action.amount, locale)}
                    </p>
                    <p className="text-[10px] text-warning font-bold">
                      {action.dueDate}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-warning group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── 8. Recent Activity ── */}
      {payload.recentTransactions && payload.recentTransactions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              {vi ? "Hoạt động gần đây" : "Recent Activity"}
            </h2>
            <Link
              href="/transactions"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              {vi ? "Xem thêm" : "View More"}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-0">
              {payload.recentTransactions.map((tx, idx) => (
                <div
                  key={tx.id}
                  className={cn(
                    "flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors",
                    idx !== payload.recentTransactions!.length - 1 &&
                      "border-b border-border/50",
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm shrink-0",
                      tx.type === "income"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800",
                    )}
                  >
                    {tx.type === "income" ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">
                      {tx.description ||
                        tx.category_name ||
                        (vi ? "Không rõ" : "Unknown")}
                    </p>
                    {tx.category_name && (
                      <p className="text-xs text-muted-foreground">
                        {tx.category_name}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        "font-bold text-sm",
                        tx.type === "income"
                          ? "text-emerald-600"
                          : "text-foreground",
                      )}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatVndCompact(tx.amount, locale)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {tx.transaction_date}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── 9. Health Suggestion ── */}
      {financialHealthEnabled ? (
      <Card className="border-none bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 overflow-hidden ring-1 ring-amber-200/50 dark:ring-amber-900/30">
        <CardHeader className="pb-2">
          <SectionHeader
            label={vi ? "Sức khỏe" : "Health"}
            title={vi ? "Gợi ý cải thiện" : "Financial Suggestion"}
          />
        </CardHeader>
        <CardContent className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 shadow-md">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {displayAction}
            </p>
            {payload.health && (
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                <HealthFactor
                  label={vi ? "Dòng tiền" : "Cashflow"}
                  score={payload.health.factorScores.cashflow}
                  color="bg-amber-500"
                />
                <HealthFactor
                  label={vi ? "Dự phòng" : "Emergency"}
                  score={payload.health.factorScores.emergency}
                  color="bg-emerald-500"
                />
                <HealthFactor
                  label={vi ? "Khoản nợ" : "Debt"}
                  score={payload.health.factorScores.debt}
                  color="bg-blue-500"
                />
                <HealthFactor
                  label={vi ? "Mục tiêu" : "Goals"}
                  score={payload.health.factorScores.goals}
                  color="bg-purple-500"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      ) : null}

      {/* ── 10. Data Drill-Down ── */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <SectionHeader
            label={vi ? "Minh bạch" : "Transparency"}
            title={vi ? "Truy vết dữ liệu" : "Data Drill-Down"}
            description={
              vi
                ? "Nguồn gốc của các chỉ số tài chính trên."
                : "The sources behind the metrics above."
            }
          />
        </CardHeader>
        <CardContent className="space-y-3">
          <details className="group rounded-xl border border-border bg-muted/5 p-4 transition-all hover:bg-muted/10">
            <summary className="flex cursor-pointer items-center justify-between list-none">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-xs">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground">
                  {vi ? "Thành phần tài sản ròng" : "Net Worth Components"}
                </span>
              </div>
              <Info className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-success">
                    {vi ? "Tài sản" : "Assets"}
                  </p>
                  <ul className="space-y-1">
                    {(payload.drilldowns?.netWorth.assets ?? []).map((row) => (
                      <li
                        key={`a-${row.source}`}
                        className="flex items-center justify-between rounded-lg bg-background p-2 text-xs border border-border/50"
                      >
                        <span className="font-medium">{row.label}</span>
                        <span className="font-bold">
                          {formatVndCompact(row.value, locale)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-destructive">
                    {vi ? "Nợ phải trả" : "Liabilities"}
                  </p>
                  <ul className="space-y-1">
                    {(payload.drilldowns?.netWorth.liabilities ?? []).map(
                      (row) => (
                        <li
                          key={`l-${row.source}`}
                          className="flex items-center justify-between rounded-lg bg-background p-2 text-xs border border-border/50"
                        >
                          <span className="font-medium">{row.label}</span>
                          <span className="font-bold">
                            {formatVndCompact(row.value, locale)}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </details>

          <details className="group rounded-xl border border-border bg-muted/5 p-4 transition-all hover:bg-muted/10">
            <summary className="flex cursor-pointer items-center justify-between list-none">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-xs">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground">
                  {vi ? "Dòng tiền thực tế" : "Real Cash Flow"}
                </span>
              </div>
              <Info className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-xs font-semibold text-muted-foreground italic">
                {vi ? "Chu kỳ" : "Window"}:{" "}
                {payload.drilldowns?.cashFlow.monthStart} –{" "}
                {payload.drilldowns?.cashFlow.monthEnd}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-success">
                    {vi ? "Thu nhập" : "Income"}
                  </p>
                  <ul className="space-y-1">
                    {(payload.drilldowns?.cashFlow.income ?? []).map((row) => (
                      <li
                        key={`i-${row.source}`}
                        className="flex items-center justify-between rounded-lg bg-background p-2 text-xs border border-border/50"
                      >
                        <span className="font-medium">{row.label}</span>
                        <span className="font-bold">
                          {formatVndCompact(row.value, locale)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-destructive">
                    {vi ? "Chi tiêu" : "Spending"}
                  </p>
                  <ul className="space-y-1">
                    {(payload.drilldowns?.cashFlow.expense ?? []).map((row) => (
                      <li
                        key={`e-${row.source}`}
                        className="flex items-center justify-between rounded-lg bg-background p-2 text-xs border border-border/50"
                      >
                        <span className="font-medium">{row.label}</span>
                        <span className="font-bold">
                          {formatVndCompact(row.value, locale)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>

      {/* ── 11. Quick Actions ── */}
      <Card className="border-transparent bg-transparent shadow-none">
        <CardHeader className="px-0">
          <SectionHeader
            label={vi ? "Lối tắt" : "Shortcuts"}
            title={vi ? "Thao tác nhanh" : "Quick Actions"}
          />
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickAction
              href="/transactions"
              icon={History}
              label={vi ? "Ghi chi tiêu" : "Log Expense"}
              variant="primary"
            />
            <QuickAction
              href="/goals"
              icon={Target}
              label={vi ? "Mục tiêu" : "Goals"}
            />
            {jarsEnabled ? (
              <QuickAction
                href="/jars"
                icon={Sparkles}
                label={vi ? "Hũ tài chính" : "Jars"}
              />
            ) : null}
            {financialHealthEnabled ? (
              <QuickAction
                href="/health"
                icon={Zap}
                label={vi ? "Sức khỏe" : "Health"}
              />
            ) : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

// ── Helper Components ──────────────────────────────────────────────────────

function HealthFactor({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <span className="text-[10px] font-bold text-slate-400">{score}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            color,
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  variant = "secondary",
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <Button
      asChild
      variant={variant === "primary" ? "default" : "outline"}
      className={cn(
        "h-auto flex-col items-center justify-center gap-2 rounded-2xl p-4 transition-all duration-300",
        variant === "secondary" &&
          "hover:border-primary/40 hover:bg-primary/5 hover:text-primary border-border bg-card shadow-sm",
      )}
    >
      <Link href={href}>
        <Icon
          className={cn(
            "h-6 w-6",
            variant === "secondary"
              ? "text-primary/70"
              : "text-primary-foreground",
          )}
        />
        <span className="text-xs font-bold leading-tight">{label}</span>
      </Link>
    </Button>
  );
}
