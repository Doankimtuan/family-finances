"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { compactMonth, formatMonths, formatPercent, formatVnd } from "@/lib/dashboard/format";
import type { DashboardCoreResponse, DashboardTrendPoint } from "@/lib/dashboard/types";

type FetchState = "idle" | "loading" | "success" | "error";

function MetricCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
      {note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}
    </article>
  );
}

function TrendMiniBars({ trend }: { trend: DashboardTrendPoint[] }) {
  const maxNetWorth = useMemo(() => {
    if (trend.length === 0) {
      return 1;
    }

    return Math.max(...trend.map((point) => Number(point.net_worth)), 1);
  }, [trend]);

  if (trend.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        No historical trend data yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Net Worth Trend (6 months)</p>
      <div className="mt-3 flex h-28 items-end gap-2">
        {trend.map((point) => {
          const raw = Number(point.net_worth);
          const ratio = Math.max(raw / maxNetWorth, 0.08);

          return (
            <div key={point.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-teal-500"
                style={{ height: `${Math.round(ratio * 100)}%` }}
                title={`${compactMonth(point.month)}: ${formatVnd(raw)}`}
              />
              <span className="text-[10px] font-medium text-slate-500">{compactMonth(point.month)}</span>
            </div>
          );
        })}
      </div>
    </div>
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
        const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorBody?.error ?? `Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as DashboardCoreResponse;
      setPayload(data);
      setState("success");
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : "Failed to load dashboard data.");
      setState("error");
    }

    return () => controller.abort();
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === "loading" || state === "idle") {
    return (
      <section className="space-y-3" aria-busy="true" aria-live="polite">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
          ))}
        </div>
        <div className="h-44 animate-pulse rounded-2xl bg-white shadow-sm" />
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="rounded-2xl border border-rose-200 bg-white p-4 shadow-sm" role="alert">
        <p className="text-sm font-semibold text-rose-700">Could not load core dashboard data.</p>
        <p className="mt-1 text-sm text-slate-600">{errorMessage}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 w-full rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white sm:w-auto"
        >
          Retry
        </button>
      </section>
    );
  }

  if (!payload || !payload.metrics) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-800">No dashboard data yet</p>
        <p className="mt-1 text-sm text-slate-600">
          Add your first account, asset, and transaction to generate net worth and cash flow metrics.
        </p>
      </section>
    );
  }

  const { metrics, trend } = payload;

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricCard label="Net Worth" value={formatVnd(Number(metrics.net_worth))} />
        <MetricCard label="Total Assets" value={formatVnd(Number(metrics.total_assets))} />
        <MetricCard label="Total Liabilities" value={formatVnd(Number(metrics.total_liabilities))} />
        <MetricCard
          label="Monthly Cash Flow"
          value={formatVnd(Number(metrics.monthly_savings))}
          note={`Income ${formatVnd(Number(metrics.monthly_income))} · Expense ${formatVnd(Number(metrics.monthly_expense))}`}
        />
        <MetricCard label="Savings Rate" value={formatPercent(metrics.savings_rate)} />
        <MetricCard
          label="Emergency Runway"
          value={formatMonths(metrics.emergency_months)}
          note={`Debt service ratio ${formatPercent(metrics.debt_service_ratio)}`}
        />
      </div>

      <TrendMiniBars trend={trend} />
    </section>
  );
}
