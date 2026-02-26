"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { compactMonth, formatVndCompact } from "@/lib/dashboard/format";
import type { LiabilityProjectionPoint } from "@/lib/debts/amortization";
import { useI18n } from "@/lib/providers/i18n-provider";

type Props = {
  schedule: LiabilityProjectionPoint[];
};

export function PayoffChart({ schedule }: Props) {
  const { locale, language } = useI18n();
  const vi = language === "vi";
  const chartData = schedule.map((row) => ({
    month: compactMonth(row.month, locale),
    balance: row.balance,
    payment: row.payment,
  }));

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        {vi ? "Thêm thông tin khoản nợ để tạo dự phóng trả nợ." : "Add debt details to generate payoff projection."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
          {vi ? "Dư nợ dự kiến theo thời gian" : "Projected Outstanding Balance"}
        </p>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 6, bottom: 0, left: 6 }}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
              <YAxis
                width={80}
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickFormatter={(value: number) => formatVndCompact(value, locale)}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip formatter={(value) => formatVndCompact(Number(value ?? 0), locale)} />
              <Line type="monotone" dataKey="balance" stroke="#0F766E" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
          {vi ? "Khoản thanh toán dự kiến hàng tháng" : "Projected Monthly Payment"}
        </p>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 6, bottom: 0, left: 6 }}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
              <YAxis
                width={80}
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickFormatter={(value: number) => formatVndCompact(value, locale)}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip formatter={(value) => formatVndCompact(Number(value ?? 0), locale)} />
              <Bar dataKey="payment" fill="#334155" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
