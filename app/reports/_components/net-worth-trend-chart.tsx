"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { compactMonth, formatVnd, formatVndCompact } from "@/lib/dashboard/format";

type Point = { month: string; net_worth: number };

export function NetWorthTrendChart({ points }: { points: Point[] }) {
  const data = points.map((p) => ({ month: compactMonth(p.month), netWorth: Number(p.net_worth) }));

  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No monthly snapshots yet.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="nwTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F766E" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#0F766E" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatVndCompact(v)} />
          <Tooltip formatter={(v) => formatVnd(Number(v ?? 0))} />
          <Area type="monotone" dataKey="netWorth" stroke="#0F766E" fill="url(#nwTrendFill)" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
