"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { compactMonth, formatPercent } from "@/lib/dashboard/format";
import type { LiabilityProjectionPoint } from "@/lib/debts/amortization";

type Props = {
  schedule: LiabilityProjectionPoint[];
};

const phaseColorMap: Record<LiabilityProjectionPoint["phase"], string> = {
  promo: "#0F766E",
  floating: "#C2410C",
  custom: "#475569",
};

export function RatePhaseChart({ schedule }: Props) {
  const chartData = schedule.slice(0, 24).map((row) => ({
    month: compactMonth(row.month),
    annualRate: row.annualRate,
    phase: row.phase,
    phaseLabel: row.phaseLabel,
  }));

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        No rate data available yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Rate Timeline (Promo to Floating)</p>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 6, bottom: 0, left: 6 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
            <YAxis
              width={70}
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickFormatter={(value: number) => formatPercent(value)}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) => [formatPercent(Number(value ?? 0)), "Annual rate"]}
              labelFormatter={(_, payload) => {
                const item = payload?.[0]?.payload as { phaseLabel?: string } | undefined;
                return item?.phaseLabel ?? "Rate phase";
              }}
            />
            <Bar dataKey="annualRate" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={`${entry.month}-${idx}`} fill={phaseColorMap[entry.phase]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-teal-700" />Promo</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-700" />Floating</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-600" />Configured</span>
      </div>
    </div>
  );
}
