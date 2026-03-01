"use client";

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
import { TrendingUp, PieChart as PieIcon } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  compactMonth,
  formatPercent,
  formatVnd,
  formatVndCompact,
} from "@/lib/dashboard/format";
import type { DashboardTrendPoint } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

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

export function NetWorthTrend({
  trend,
  locale,
  vi,
}: {
  trend: DashboardTrendPoint[];
  locale: string;
  vi: boolean;
}) {
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

export function MonthlyExpenseAllocation({
  expenseRows,
  vi,
  locale,
}: {
  expenseRows: Array<{ label: string; value: number; color?: string | null }>;
  vi: boolean;
  locale: string;
}) {
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
