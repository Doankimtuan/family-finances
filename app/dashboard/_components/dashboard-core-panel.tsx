"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  PieChart as PieIcon,
  HeartPulse,
  Sparkles,
  Info,
  History,
  TrendingUp,
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
  compactMonth,
  formatMonths,
  formatPercent,
  formatVnd,
  formatVndCompact,
} from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import type {
  DashboardCoreResponse,
  DashboardTrendPoint,
} from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type FetchState = "idle" | "loading" | "success" | "error";
const PIE_COLORS = [
  "#0F766E",
  "#0284C7",
  "#16A34A",
  "#EA580C",
  "#7C3AED",
  "#BE123C",
  "#6D28D9",
  "#64748B",
];

function NetWorthTrend({ trend }: { trend: DashboardTrendPoint[] }) {
  const { locale, language } = useI18n();
  const vi = language === "vi";
  const chartData = trend.map((point) => ({
    month: compactMonth(point.month, locale),
    netWorth: Number(point.net_worth),
  }));

  if (chartData.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title={vi ? "Thiếu dữ liệu xu hướng" : "Missing trend data"}
        description={
          vi
            ? "Thêm dữ liệu theo tháng để thấy rõ xu hướng."
            : "Add more monthly data to reveal trend direction."
        }
      />
    );
  }

  const latest = chartData[chartData.length - 1]?.netWorth ?? 0;
  const previous = chartData[chartData.length - 2]?.netWorth ?? latest;
  const delta = latest - previous;
  const pctChange = previous > 0 ? (delta / previous) * 100 : 0;

  return (
    <Card className="animate-in fade-in duration-700">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <SectionHeader
          label={vi ? "Xu hướng" : "Trend"}
          title={vi ? "Tài sản ròng" : "Net Worth"}
          description={
            delta >= 0
              ? vi
                ? "Xu hướng đang tăng. Tiếp tục kế hoạch hiện tại."
                : "Trend is moving upward. Keep current plan."
              : vi
                ? "Xu hướng giảm. Kiểm tra chi tiêu và nợ trong tháng này."
                : "Trend dipped. Inspect spending and liabilities this month."
          }
        />
        <div className="flex flex-col items-end">
          <Badge
            variant={delta >= 0 ? "success" : "destructive"}
            className="text-[10px] font-bold"
          >
            {delta >= 0 ? "+" : ""}
            {formatPercent(pctChange / 100)}
          </Badge>
          <p
            className={cn(
              "mt-1 text-xs font-bold",
              delta >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {delta >= 0 ? "+" : ""}
            {formatVndCompact(delta, locale)}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-60 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 4, bottom: 0, left: 4 }}
            >
              <defs>
                <linearGradient
                  id="netWorthGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--primary)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--primary)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="month"
                tick={{
                  fontSize: 11,
                  fill: "var(--muted-foreground)",
                  fontWeight: 500,
                }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                tick={{
                  fontSize: 10,
                  fill: "var(--muted-foreground)",
                  fontWeight: 500,
                }}
                tickLine={false}
                axisLine={false}
                width={70}
                tickFormatter={(value: number) =>
                  formatVndCompact(value, locale)
                }
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "16px",
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                  borderWidth: "1px",
                  padding: "12px",
                }}
                labelStyle={{
                  fontWeight: 700,
                  color: "var(--foreground)",
                  marginBottom: "4px",
                }}
                itemStyle={{ fontSize: "12px", fontWeight: 600 }}
                formatter={(value) => [
                  formatVnd(Number(value ?? 0), locale),
                  vi ? "Tài sản ròng" : "Net worth",
                ]}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="var(--primary)"
                fill="url(#netWorthGradient)"
                strokeWidth={3}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function MonthlyExpenseAllocation({
  expenseRows,
  language,
  locale,
}: {
  expenseRows: Array<{ label: string; value: number; color?: string | null }>;
  language: "en" | "vi";
  locale: string;
}) {
  const vi = language === "vi";
  const rows = expenseRows
    .map((row) => ({
      name: row.label,
      value: Number(row.value),
      color: row.color ?? null,
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  if (rows.length === 0 || total <= 0) {
    return (
      <Card>
        <CardHeader>
          <SectionHeader
            label={vi ? "Chi phí" : "Expenses"}
            title={vi ? "Phân bổ theo danh mục" : "Category Allocation"}
          />
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={PieIcon}
            title={vi ? "Chưa có dữ liệu chi tiêu" : "No expense data"}
            description={
              vi
                ? "Ghi lại giao dịch đầu tiên để xem phân bổ chi tiêu của gia đình."
                : "Log your first transaction to see how your household spends."
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-in fade-in duration-700 delay-100">
      <CardHeader>
        <SectionHeader
          label={vi ? "Chi phí" : "Expenses"}
          title={vi ? "Phân bổ tháng này" : "Monthly Allocation"}
          description={`${vi ? "Tổng" : "Total"}: ${formatVnd(total, locale)}`}
        />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={4}
                  animationBegin={200}
                  animationDuration={1200}
                >
                  {rows.map((row, index) => (
                    <Cell
                      key={`${row.name}-${index}`}
                      fill={row.color ?? PIE_COLORS[index % PIE_COLORS.length]}
                      className="stroke-background stroke-2 outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    padding: "12px",
                  }}
                  formatter={(value, name) => {
                    const numeric = Number(value ?? 0);
                    const pct = total > 0 ? (numeric / total) * 100 : 0;
                    return [
                      `${formatVnd(numeric, locale)} (${pct.toFixed(1)}%)`,
                      String(name),
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="space-y-3">
            {rows.slice(0, 6).map((row, index) => {
              const pct = total > 0 ? (row.value / total) * 100 : 0;
              return (
                <li
                  key={`legend-${row.name}-${index}`}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full shadow-sm"
                      style={{
                        backgroundColor:
                          row.color ?? PIE_COLORS[index % PIE_COLORS.length],
                      }}
                    />
                    <span className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {row.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-foreground">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </li>
              );
            })}
            {rows.length > 6 && (
              <li className="pt-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
                + {rows.length - 6} {vi ? "danh mục khác" : "more categories"}
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardCorePanel() {
  const { locale, language } = useI18n();
  const vi = language === "vi";
  const [state, setState] = useState<FetchState>("idle");
  const [payload, setPayload] = useState<DashboardCoreResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const load = useCallback(async () => {
    const controller = new AbortController();
    setState("loading");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/dashboard/core?months=6`, {
        method: "GET",
        signal: controller.signal,
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

      const data = (await response.json()) as DashboardCoreResponse;
      setPayload(data);
      setState("success");
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setErrorMessage(
        error instanceof Error
          ? error.message
          : vi
            ? "Lỗi máy chủ."
            : "Server error.",
      );
      setState("error");
    }
    return () => controller.abort();
  }, [vi]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === "loading" || state === "idle") {
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

  if (state === "error") {
    return (
      <EmptyState
        icon={HeartPulse}
        title={vi ? "Trục trặc kỹ thuật" : "Technical issue"}
        description={errorMessage}
        action={
          <Button onClick={() => void load()} variant="outline" size="sm">
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

      <NetWorthTrend trend={trend} />

      <MonthlyExpenseAllocation
        expenseRows={payload.drilldowns?.cashFlow.expense ?? []}
        language={language}
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
