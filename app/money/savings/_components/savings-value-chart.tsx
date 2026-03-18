"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatVnd } from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import type { SavingsProjectionPoint } from "@/lib/savings/types";

type Props = {
  points: SavingsProjectionPoint[];
  todayIndex?: number;
  locale: string;
  currency?: string;
};

export function SavingsValueChart({
  points,
  todayIndex,
  locale,
}: Props) {
  const { t } = useI18n();
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold text-slate-900">
          {t("savings.chart.title")}
        </h3>
        <p className="text-sm text-slate-500">
          {t("savings.chart.description")}
        </p>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points}>
            <defs>
              <linearGradient id="savingsNet" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0f766e" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => formatVnd(Number(value), locale)}
              width={90}
            />
            <Tooltip
              formatter={(value, name) => [
                formatVnd(Number(value), locale),
                name === "netValue"
                  ? t("savings.chart.series.net_value")
                  : t("savings.chart.series.principal"),
              ]}
            />
            {todayIndex !== undefined && points[todayIndex] ? (
              <ReferenceLine
                x={points[todayIndex]!.date}
                stroke="#f59e0b"
                strokeDasharray="4 4"
              />
            ) : null}
            <Area
              type="monotone"
              dataKey="principal"
              stroke="#64748b"
              fillOpacity={0}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="netValue"
              stroke="#0f766e"
              fill="url(#savingsNet)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
