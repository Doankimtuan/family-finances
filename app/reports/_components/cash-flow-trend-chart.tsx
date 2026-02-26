"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { compactMonth, formatVndCompact } from "@/lib/dashboard/format";

type Point = { month: string; income: number; expense: number; savings: number };

export function CashFlowTrendChart({ points }: { points: Point[] }) {
  const data = points.map((p) => ({
    month: compactMonth(p.month),
    income: Number(p.income),
    expense: Number(p.expense),
    savings: Number(p.savings),
  }));

  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No cash-flow snapshots yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatVndCompact(v)} />
            <Tooltip formatter={(v) => formatVndCompact(Number(v ?? 0))} />
            <Legend />
            <Bar dataKey="income" fill="#0F766E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#C2410C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatVndCompact(v)} />
            <Tooltip formatter={(v) => formatVndCompact(Number(v ?? 0))} />
            <Line type="monotone" dataKey="savings" stroke="#334155" strokeWidth={2.3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
