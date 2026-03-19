"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVnd, formatVndCompact } from "@/lib/dashboard/format";

type JarTrendPoint = {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
};

export function JarTrendChart({
  data,
  locale,
}: {
  data: JarTrendPoint[];
  locale: string;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Xu hướng 12 tháng</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="jarNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => formatVndCompact(value, locale)}
              />
              <Tooltip formatter={(value) => formatVnd(Number(value ?? 0), locale)} />
              <Area
                type="monotone"
                dataKey="net"
                stroke="#2563EB"
                fill="url(#jarNet)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
