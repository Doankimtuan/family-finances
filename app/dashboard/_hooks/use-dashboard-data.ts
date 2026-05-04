"use client";

import { useQuery } from "@tanstack/react-query";
import { CACHE } from "@/lib/constants";
import { dashboardKeys } from "@/lib/queries/keys";
import type { DashboardCoreResponse } from "@/lib/dashboard/types";

export function useDashboardData() {
  return useQuery<DashboardCoreResponse>({
    queryKey: dashboardKeys.core(),
    queryFn: async () => {
      const asOfDate = new Date().toISOString().slice(0, 10);

      const [summaryRes, activityRes, goalsRes] = await Promise.all([
        fetch(`/api/dashboard/summary?asOfDate=${asOfDate}&months=6`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
        fetch(`/api/dashboard/activity?asOfDate=${asOfDate}&limit=5`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
        fetch(`/api/dashboard/goals`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
      ]);

      if (!summaryRes.ok) {
        const errorBody = (await summaryRes.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorBody?.error ?? `Summary request failed with status ${summaryRes.status}`,
        );
      }

      if (!activityRes.ok) {
        const errorBody = (await activityRes.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorBody?.error ?? `Activity request failed with status ${activityRes.status}`,
        );
      }

      if (!goalsRes.ok) {
        const errorBody = (await goalsRes.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorBody?.error ?? `Goals request failed with status ${goalsRes.status}`,
        );
      }

      const summary = await summaryRes.json();
      const activity = await activityRes.json();
      const goals = await goalsRes.json();

      // Combine responses into DashboardCoreResponse structure
      return {
        metrics: summary.metrics,
        trend: summary.trend,
        health: summary.health,
        drilldowns: {
          netWorth: {
            assets: [],
            liabilities: [],
          },
          cashFlow: {
            income: [],
            expense: [],
            monthStart: activity.monthRange?.start ?? summary.metrics?.month_start,
            monthEnd: activity.monthRange?.end ?? summary.metrics?.month_end,
          },
        },
        goals: goals.goals ?? [],
        recentTransactions: activity.recentTransactions ?? [],
        priorityActions: activity.priorityActions ?? [],
        pendingJarReviews: summary.pendingJarReviews ?? 0,
        jars: [],
        spendingJarAlerts: summary.spendingJarAlerts ?? [],
      } as DashboardCoreResponse;
    },
    staleTime: CACHE.STALE_TIME_DASHBOARD,
  });
}
