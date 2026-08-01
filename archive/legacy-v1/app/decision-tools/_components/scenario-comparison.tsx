"use client";

import React, { useState } from "react";
import {
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatVndCompact } from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import { buildComparisonSeries } from "../_lib/calculations";
import { SavedScenario } from "../_lib/types";

export function ScenarioComparisonCard({
  savedScenarios,
}: {
  savedScenarios: SavedScenario[];
}) {
  const { locale } = useI18n();
  const comparableWithSeries = savedScenarios.filter(
    (s) => Array.isArray(s.timeseries_json) && s.timeseries_json.length > 0,
  );
  const scenarioTypeCounts = comparableWithSeries.reduce((acc, row) => {
    acc.set(row.scenario_type, (acc.get(row.scenario_type) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());
  const comparable = comparableWithSeries.filter(
    (row) => (scenarioTypeCounts.get(row.scenario_type) ?? 0) >= 2,
  );

  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  const left = comparable.find((s) => s.id === leftId) ?? comparable[0] ?? null;
  const rightCandidates = left
    ? comparable.filter(
        (s) => s.scenario_type === left.scenario_type && s.id !== left.id,
      )
    : [];
  const right =
    rightCandidates.find((s) => s.id === rightId) ?? rightCandidates[0] ?? null;

  const chartData = buildComparisonSeries(left, right);

  if (comparable.length < 2) {
    return (
      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Scenario Comparison
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Save at least two scenarios of the same type with computed results
            to compare side-by-side.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Side-by-Side Comparison
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Compare two saved scenarios to identify which path improves your
          outcome.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Scenario A
            </span>
            <Select
              value={left?.id ?? ""}
              onValueChange={(val) => setLeftId(val)}
            >
              <SelectTrigger className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-sm text-slate-900">
                <SelectValue placeholder="Select Scenario A" />
              </SelectTrigger>
              <SelectContent>
                {comparable.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Scenario B
            </span>
            <Select
              value={right?.id ?? ""}
              onValueChange={(val) => setRightId(val)}
            >
              <SelectTrigger className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-sm text-slate-900">
                <SelectValue placeholder="Select Scenario B" />
              </SelectTrigger>
              <SelectContent>
                {rightCandidates.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ScenarioSummaryBlock scenario={left} />
          <ScenarioSummaryBlock scenario={right} />
        </div>

        {chartData.length > 0 ? (
          <div className="mt-4 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
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
                  dataKey="left"
                  name={left?.name ?? "Scenario A"}
                  stroke="#0F766E"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="right"
                  name={right?.name ?? "Scenario B"}
                  stroke="#C2410C"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Selected scenarios have no comparable timeline points.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ScenarioSummaryBlock({
  scenario,
}: {
  scenario: SavedScenario | null;
}) {
  if (!scenario) {
    return (
      <div className="rounded-xl border border-slate-200 p-3 text-sm text-slate-500">
        No scenario selected.
      </div>
    );
  }

  const metrics = scenario.key_metrics_json ?? {};
  const entries = Object.entries(metrics).slice(0, 3);

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-sm font-semibold text-slate-900">{scenario.name}</p>
      <p className="text-xs text-slate-500">
        {scenario.scenario_type.replace(/_/g, " ")}
      </p>
      <div className="mt-2 space-y-1">
        {entries.length === 0 ? (
          <p className="text-xs text-slate-500">No key metrics saved.</p>
        ) : (
          entries.map(([k, v]) => (
            <p key={k} className="text-xs text-slate-700">
              {k.replace(/_/g, " ")}: {formatMetricValue(v)}
            </p>
          ))
        )}
      </div>
    </div>
  );
}

function formatMetricValue(value: unknown) {
  if (typeof value === "number") {
    if (Math.abs(value) > 1000) return formatVndCompact(value);
    return value.toFixed(2);
  }
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}
