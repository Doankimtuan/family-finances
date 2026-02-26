"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  compactMonth,
  formatMonths,
  formatPercent,
  formatVnd,
  formatVndCompact,
} from "@/lib/dashboard/format";
import type {
  DashboardCoreResponse,
  DashboardTrendPoint,
} from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type FetchState = "idle" | "loading" | "success" | "error";

function MetricCard({
  label,
  value,
  note,
  href,
}: {
  label: string;
  value: string;
  note?: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      {note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}
    </>
  );

  const className = cn(
    "block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all",
    href ? "hover:border-teal-300 hover:shadow-md active:scale-[0.99]" : "",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}

function NetWorthTrend({ trend }: { trend: DashboardTrendPoint[] }) {
  const chartData = trend.map((point) => ({
    month: compactMonth(point.month),
    netWorth: Number(point.net_worth),
  }));

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        Add more monthly data to reveal trend direction.
      </div>
    );
  }

  const latest = chartData[chartData.length - 1]?.netWorth ?? 0;
  const previous = chartData[chartData.length - 2]?.netWorth ?? latest;
  const delta = latest - previous;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            Net Worth Direction
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {delta >= 0
              ? "Trend is moving upward. Keep current plan."
              : "Trend dipped. Inspect spending and liabilities this month."}
          </p>
        </div>
        <p
          className={`text-sm font-semibold ${delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}
        >
          {delta >= 0 ? "+" : ""}
          {formatVndCompact(delta)}
        </p>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 4, bottom: 0, left: 4 }}
          >
            <defs>
              <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D9488" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0D9488" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#E2E8F0"
              strokeDasharray="3 3"
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
              width={80}
              tickFormatter={(value: number) => formatVndCompact(value)}
            />
            <Tooltip
              formatter={(value) => [
                formatVnd(Number(value ?? 0)),
                "Net worth",
              ]}
              contentStyle={{ borderRadius: 12, borderColor: "#CBD5E1" }}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke="#0F766E"
              fill="url(#netWorthGradient)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export function DashboardCorePanel() {
  const [state, setState] = useState<FetchState>("idle");
  const [payload, setPayload] = useState<DashboardCoreResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const load = useCallback(async () => {
    const controller = new AbortController();

    setState("loading");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/dashboard/core?months=6`, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorBody?.error ?? `Request failed with status ${response.status}`,
        );
      }

      const data = (await response.json()) as DashboardCoreResponse;
      setPayload(data);
      setState("success");
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load dashboard data.",
      );
      setState("error");
    }

    return () => controller.abort();
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === "loading" || state === "idle") {
    return (
      <section className="space-y-4" aria-busy="true" aria-live="polite">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-11 animate-pulse rounded-xl bg-white shadow-sm" />
          <div className="h-11 animate-pulse rounded-xl bg-white shadow-sm" />
          <div className="h-11 animate-pulse rounded-xl bg-white shadow-sm" />
          <div className="h-11 animate-pulse rounded-xl bg-white shadow-sm" />
        </div>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section
        className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm"
        role="alert"
      >
        <p className="text-sm font-semibold text-rose-700">
          Could not load dashboard data.
        </p>
        <p className="mt-1 text-sm text-slate-600">{errorMessage}</p>
        <Button
          variant="destructive"
          onClick={() => void load()}
          className="mt-4"
        >
          Retry
        </Button>
      </section>
    );
  }

  if (!payload || !payload.metrics) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <p className="text-base font-semibold text-slate-800">
          Your first clarity snapshot is waiting
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
          Add one account, one expense, and one debt or asset to unlock a full
          household picture.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button asChild size="sm">
            <Link href="/accounts">Add Account</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/transactions">Log Expense</Link>
          </Button>
        </div>
      </section>
    );
  }

  const { metrics, trend } = payload;
  const score = payload.health?.overallScore ?? 0;
  const action =
    payload.health?.topAction ??
    "Build more data to generate a monthly top action.";

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Net Worth"
          value={formatVndCompact(Number(metrics.net_worth))}
          note={formatVnd(Number(metrics.net_worth))}
          href="/assets"
        />
        <MetricCard
          label="Monthly Balance"
          value={formatVndCompact(Number(metrics.monthly_savings))}
          note={`Income ${formatVndCompact(Number(metrics.monthly_income))} vs expense ${formatVndCompact(Number(metrics.monthly_expense))}`}
          href="/transactions"
        />
        <MetricCard
          label="Health Score"
          value={`${score.toFixed(0)}/100`}
          note={`Emergency ${formatMonths(metrics.emergency_months)} · DSR ${formatPercent(metrics.debt_service_ratio)}`}
          href="/debts"
        />
      </div>

      <NetWorthTrend trend={trend} />

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          Most Impactful Action This Month
        </p>
        <p className="mt-2 text-sm text-slate-700">{action}</p>
        {payload.health ? (
          <p className="mt-2 text-xs text-slate-500">
            Factors: cashflow {Math.round(payload.health.factorScores.cashflow)}
            , emergency {Math.round(payload.health.factorScores.emergency)},
            debt {Math.round(payload.health.factorScores.debt)}, goals{" "}
            {Math.round(payload.health.factorScores.goals)}
          </p>
        ) : null}
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          Drill-Down & Explainability
        </p>
        <div className="mt-3 space-y-2">
          <details className="group rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
              Net Worth Source of Truth
            </summary>
            <p className="mt-2 text-xs text-slate-600">
              Formula: Net worth = sum(asset line items) - sum(liability line
              items)
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-700">
              {(payload.drilldowns?.netWorth.assets ?? []).map((row) => (
                <li key={`a-${row.source}`} className="rounded-lg bg-slate-50 px-2 py-1">
                  + {row.label}: {formatVnd(row.value)} · <span className="text-slate-500">{row.source}</span>
                </li>
              ))}
              {(payload.drilldowns?.netWorth.liabilities ?? []).map((row) => (
                <li key={`l-${row.source}`} className="rounded-lg bg-slate-50 px-2 py-1">
                  - {row.label}: {formatVnd(row.value)} · <span className="text-slate-500">{row.source}</span>
                </li>
              ))}
            </ul>
          </details>

          <details className="group rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
              Cash Flow Source of Truth
            </summary>
            <p className="mt-2 text-xs text-slate-600">
              Month window: {payload.drilldowns?.cashFlow.monthStart} to{" "}
              {payload.drilldowns?.cashFlow.monthEnd}
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Income</p>
                <ul className="mt-1 space-y-1 text-xs text-slate-700">
                  {(payload.drilldowns?.cashFlow.income ?? []).map((row) => (
                    <li key={`i-${row.source}`} className="rounded-lg bg-slate-50 px-2 py-1">
                      {row.label}: {formatVnd(row.value)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Expense</p>
                <ul className="mt-1 space-y-1 text-xs text-slate-700">
                  {(payload.drilldowns?.cashFlow.expense ?? []).map((row) => (
                    <li key={`e-${row.source}`} className="rounded-lg bg-slate-50 px-2 py-1">
                      {row.label}: {formatVnd(row.value)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </details>

          <details className="group rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
              Health Score Explainability
            </summary>
            {payload.health ? (
              <>
                <p className="mt-2 text-xs text-slate-600">
                  Overall = weighted sum of factor scores. Higher is healthier.
                </p>
                <ul className="mt-2 space-y-1 text-xs text-slate-700">
                  {Object.entries(payload.health.factorScores).map(([k, v]) => {
                    const weight =
                      payload.health?.weights[
                        k as keyof typeof payload.health.weights
                      ] ?? 0;
                    const contribution = (v * weight) / 100;
                    return (
                      <li key={k} className="rounded-lg bg-slate-50 px-2 py-1">
                        {k}: score {Math.round(v)} × weight {weight}% ={" "}
                        {contribution.toFixed(1)} pts
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-xs text-slate-600">
                  Top action rule: lowest-scoring urgent factor gets prioritized.
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-slate-600">Health details not available yet.</p>
            )}
          </details>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          Quick Actions
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button asChild className="w-full">
            <Link href="/transactions">Log Expense</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/accounts">Accounts</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/categories">Categories</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/budgets">Budgets</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/goals">Goals</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/health">Health Details</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/insights">Insights</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/decision-tools">Decision Tools</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/reports">Reports</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/settings">Settings</Link>
          </Button>
        </div>
      </article>
    </section>
  );
}
