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
} from "lucide-react";
import { t as tFn } from "@/lib/i18n/dictionary";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  formatMonths,
  formatPercent,
  formatVnd,
  formatVndCompact,
} from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import type { DashboardCoreResponse } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
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
  // Resolve top action via i18n — engine now returns a dictionary key like "health.action.*"
  const topActionKey = payload.health?.topAction ?? "health.action.no_data";
  const displayAction = tFn(
    language,
    topActionKey.startsWith("health.action.")
      ? topActionKey
      : "health.action.no_data",
  );

  // Real month-over-month savings delta (not a hardcoded fake value)
  const prevMonthSavings =
    trend.length >= 2 ? Number(trend[trend.length - 2]?.savings ?? 0) : null;
  const currMonthSavings = Number(metrics.monthly_savings);
  const savingsDelta =
    prevMonthSavings !== null ? currMonthSavings - prevMonthSavings : null;
  const savingsDeltaPct =
    prevMonthSavings !== null && prevMonthSavings !== 0
      ? Math.round((savingsDelta! / Math.abs(prevMonthSavings)) * 100)
      : null;

  return (
    <section className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label={vi ? "Tài sản ròng" : "Net Worth"}
          value={formatVndCompact(Number(metrics.net_worth), locale)}
          note={formatVnd(Number(metrics.net_worth), locale)}
          href="/money"
          className="bg-card/50"
        />
        <MetricCard
          label={vi ? "Cân đối tháng" : "Balance"}
          value={formatVndCompact(Number(metrics.monthly_savings), locale)}
          note={`${vi ? "Thu nhập" : "In"} ${formatVndCompact(Number(metrics.monthly_income), locale)} · ${vi ? "Chi" : "Ex"} ${formatVndCompact(Number(metrics.monthly_expense), locale)}`}
          href="/transactions"
          className="bg-card/50"
          trend={
            savingsDeltaPct !== null
              ? {
                  value: savingsDeltaPct,
                  label: vi ? "vs tháng trước" : "vs last mo",
                }
              : undefined
          }
        />
        <MetricCard
          label={vi ? "Điểm tài chính" : "Health Score"}
          value={`${score.toFixed(0)}/100`}
          note={`${vi ? "Khẩn cấp" : "EM"} ${formatMonths(metrics.emergency_months, locale)} · DSR ${formatPercent(metrics.debt_service_ratio)}`}
          href="/health"
          className="bg-primary/5 border-primary/20"
        />
      </div>

      <NetWorthTrend trend={trend} locale={locale} vi={vi} />

      <MonthlyExpenseAllocation
        expenseRows={payload.drilldowns?.cashFlow.expense ?? []}
        vi={vi}
        locale={locale}
      />

      <Card className="border-primary/20 bg-primary/5 overflow-hidden ring-1 ring-primary/10">
        <CardHeader className="pb-2">
          <SectionHeader
            label={vi ? "Ưu tiên" : "Priority"}
            title={vi ? "Hành động quan trọng nhất" : "Most Impactful Action"}
          />
        </CardHeader>
        <CardContent className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground leading-tight">
              {displayAction}
            </p>
            {payload.health && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="bg-background/80 text-[10px] uppercase tracking-wider"
                >
                  {vi ? "Dòng tiền" : "Cashflow"}{" "}
                  {Math.round(payload.health.factorScores.cashflow)}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-background/80 text-[10px] uppercase tracking-wider"
                >
                  {vi ? "Quỹ" : "Emergency"}{" "}
                  {Math.round(payload.health.factorScores.emergency)}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-background/80 text-[10px] uppercase tracking-wider"
                >
                  {vi ? "Nợ" : "Debt"}{" "}
                  {Math.round(payload.health.factorScores.debt)}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-background/80 text-[10px] uppercase tracking-wider"
                >
                  {vi ? "Mục tiêu" : "Goals"}{" "}
                  {Math.round(payload.health.factorScores.goals)}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                {payload.drilldowns?.cashFlow.monthStart} -{" "}
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
            <QuickAction
              href="/insights"
              icon={Sparkles}
              label={vi ? "Gợi ý" : "Insights"}
            />
            <QuickAction
              href="/health"
              icon={Zap}
              label={vi ? "Sức khỏe" : "Health"}
            />
          </div>
        </CardContent>
      </Card>
    </section>
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
