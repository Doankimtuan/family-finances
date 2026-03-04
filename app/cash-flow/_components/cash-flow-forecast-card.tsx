"use client";

import { AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatVndCompact } from "@/lib/dashboard/format";

type ForecastRow = {
  forecast_date: string;
  opening_balance: number;
  inflow: number;
  outflow: number;
  closing_balance: number;
  p10_closing_balance: number;
  p50_closing_balance: number;
  p90_closing_balance: number;
  risk_flag: string | null;
};

type ForecastResponse = {
  startDate: string;
  days: number;
  firstNegativeDate: string | null;
  rows: ForecastRow[];
};

export function CashFlowForecastCard() {
  const { data, isLoading, isError, error } = useQuery<ForecastResponse>({
    queryKey: ["cashflow-forecast", 90],
    queryFn: async () => {
      const response = await fetch("/api/cash-flow/forecast?days=90", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? `Request failed with ${response.status}`);
      }

      return (await response.json()) as ForecastResponse;
    },
    staleTime: 60000,
  });

  const chartRows = (data?.rows ?? []).map((row) => ({
    ...row,
    dateLabel: row.forecast_date.slice(5),
  }));

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">90-Day Forecast</h2>
            <p className="text-sm text-slate-600">
              Deterministic projection from recurring rules, debt dues, and card due amounts.
            </p>
          </div>
          {data?.firstNegativeDate ? (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                First Negative Day
              </p>
              <p className="text-sm font-bold text-amber-800">
                {formatDate(data.firstNegativeDate, "en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              No negative balance in forecast window
            </div>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-600">Loading forecast...</p>
        ) : isError ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <span>{error instanceof Error ? error.message : "Failed to load forecast."}</span>
          </div>
        ) : chartRows.length === 0 ? (
          <p className="text-sm text-slate-600">No forecast rows returned.</p>
        ) : (
          <>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartRows} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="forecastBandFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0F766E" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#0F766E" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                    tickFormatter={(value: number) => formatVndCompact(value, "en-US")}
                  />
                  <Tooltip
                    formatter={(value: number, key: string) => [formatVndCompact(Number(value), "en-US"), key]}
                    labelFormatter={(label) => `Date: ${String(label)}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="p90_closing_balance"
                    name="P90"
                    stroke="transparent"
                    fill="url(#forecastBandFill)"
                    fillOpacity={1}
                  />
                  <Area
                    type="monotone"
                    dataKey="p10_closing_balance"
                    name="P10"
                    stroke="transparent"
                    fill="#ffffff"
                    fillOpacity={1}
                  />
                  <Line type="monotone" dataKey="p50_closing_balance" name="P50 (Median)" stroke="#0F766E" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="inflow" name="Inflow" stroke="#0284C7" strokeWidth={1.8} dot={false} />
                  <Line type="monotone" dataKey="outflow" name="Outflow" stroke="#DC2626" strokeWidth={1.8} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Start Balance</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatVndCompact(chartRows[0]?.opening_balance ?? 0, "en-US")}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Total Inflow</p>
                <p className="text-sm font-semibold text-emerald-700">
                  {formatVndCompact(
                    chartRows.reduce((sum, row) => sum + Number(row.inflow ?? 0), 0),
                    "en-US",
                  )}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Total Outflow</p>
                <p className="text-sm font-semibold text-rose-700">
                  {formatVndCompact(
                    chartRows.reduce((sum, row) => sum + Number(row.outflow ?? 0), 0),
                    "en-US",
                  )}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
