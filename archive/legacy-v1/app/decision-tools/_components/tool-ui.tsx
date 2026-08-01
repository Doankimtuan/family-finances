"use client";

import React, { useActionState, useState, useTransition } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercent, formatVndCompact } from "@/lib/dashboard/format";
import { saveScenarioAction } from "@/app/decision-tools/actions";
import {
  initialScenarioActionState,
  type ScenarioActionState,
} from "@/app/decision-tools/action-types";
import { TabKey } from "../_lib/types";

export function safeNumber(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function NumericInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={0}
        onChange={(e) =>
          onChange(Math.max(0, safeNumber(Number(e.target.value), value)))
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
      />
      <p className="text-[11px] text-slate-500">{formatVndCompact(value)}</p>
    </label>
  );
}

export function RateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        type="number"
        step="0.001"
        min="0"
        value={value}
        onChange={(e) =>
          onChange(
            Math.max(0, Math.min(2, safeNumber(Number(e.target.value), value))),
          )
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
      />
      <p className="text-[11px] text-slate-500">{formatPercent(value)}</p>
    </label>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function SimpleLineChart({
  data,
  lineA,
  lineB,
  labelA,
  labelB,
}: {
  data: Array<Record<string, number>>;
  lineA: string;
  lineB: string;
  labelA: string;
  labelB: string;
}) {
  if (data.length === 0)
    return (
      <p className="mt-3 text-sm text-slate-500">
        Run this scenario to see projection chart.
      </p>
    );

  return (
    <div className="mt-4 h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#E2E8F0"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatVndCompact(v)}
          />
          <Tooltip
            formatter={(value) => formatVndCompact(Number(value ?? 0))}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={lineA}
            name={labelA}
            stroke="#0F766E"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey={lineB}
            name={labelB}
            stroke="#334155"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleBarChart({
  data,
  barA,
  barB,
  labelA,
  labelB,
}: {
  data: Array<Record<string, number>>;
  barA: string;
  barB: string;
  labelA: string;
  labelB: string;
}) {
  if (data.length === 0)
    return (
      <p className="mt-3 text-sm text-slate-500">
        Run this scenario to see comparison chart.
      </p>
    );

  return (
    <div className="mt-4 h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            stroke="#E2E8F0"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatVndCompact(v)}
          />
          <Tooltip
            formatter={(value) => formatVndCompact(Number(value ?? 0))}
          />
          <Legend />
          <Bar
            dataKey={barA}
            name={labelA}
            fill="#0F766E"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey={barB}
            name={labelB}
            fill="#334155"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScenarioCard({
  title,
  description,
  scenarioType,
  defaultName,
  assumptions,
  summary,
  timeseries,
  keyMetrics,
  children,
}: {
  title: string;
  description: string;
  scenarioType: TabKey;
  defaultName: string;
  assumptions: Record<string, unknown>;
  summary: Record<string, unknown>;
  timeseries: unknown[];
  keyMetrics: Record<string, unknown>;
  children: React.ReactNode;
}) {
  const [name, setName] = useState(defaultName);
  const canSave = name.trim().length >= 3;
  const [saveState, action] = useActionState<ScenarioActionState, FormData>(
    saveScenarioAction,
    initialScenarioActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
        <div className="mt-4">{children}</div>

        <form
          className="mt-4 space-y-2"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            fd.set("scenarioType", scenarioType);
            fd.set("name", name);
            fd.set("assumptionsJson", JSON.stringify(assumptions));
            fd.set("summaryJson", JSON.stringify(summary));
            fd.set("timeseriesJson", JSON.stringify(timeseries));
            fd.set("keyMetricsJson", JSON.stringify(keyMetrics));
            startTransition(() => action(fd));
          }}
        >
          <input type="hidden" name="scenarioType" value={scenarioType} />
          <input type="hidden" name="assumptionsJson" value="{}" />
          <input type="hidden" name="summaryJson" value="{}" />
          <input type="hidden" name="timeseriesJson" value="[]" />
          <input type="hidden" name="keyMetricsJson" value="{}" />

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
            aria-invalid={!canSave}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
          <button
            type="submit"
            disabled={isPending || !canSave}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Scenario"}
          </button>
          {!canSave ? (
            <p className="text-xs text-amber-700">
              Scenario name must be at least 3 characters.
            </p>
          ) : null}
          {saveState.status === "error" && saveState.message ? (
            <p className="text-xs text-rose-600">{saveState.message}</p>
          ) : null}
          {saveState.status === "success" && saveState.message ? (
            <p className="text-xs text-emerald-600">{saveState.message}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
