"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardCoreResponse } from "@/lib/dashboard/types";

export function useDashboardData() {
  return useQuery<DashboardCoreResponse>({
    queryKey: ["dashboard-core"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/core?months=6", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorBody?.error ?? `Request failed with status ${response.status}`,
        );
      }

      return (await response.json()) as DashboardCoreResponse;
    },
    staleTime: 60_000,
  });
}
