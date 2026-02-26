"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const TABLES_WITH_HOUSEHOLD_ID = [
  "household_members",
  "accounts",
  "categories",
  "transactions",
  "monthly_budgets",
  "assets",
  "asset_quantity_history",
  "asset_price_history",
  "liabilities",
  "liability_rate_periods",
  "liability_payments",
  "goals",
  "goal_contributions",
  "health_score_snapshots",
  "insights",
  "scenarios",
  "scenario_results",
  "monthly_household_snapshots",
] as const;

export function HouseholdRealtimeSync() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    async function loadHouseholdContext() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active || !user) {
        return;
      }

      const membership = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!active || membership.error || !membership.data?.household_id) {
        return;
      }

      setHouseholdId(membership.data.household_id);
    }

    void loadHouseholdContext();

    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!householdId) {
      return;
    }

    const scheduleRefresh = () => {
      if (refreshTimerRef.current !== null) {
        return;
      }

      // Non-obvious: debounce refresh bursts because a single user action can emit
      // multiple row-level events across related tables.
      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        queryClient.invalidateQueries();
        router.refresh();
      }, 450);
    };

    const channel = supabase.channel(`household-sync:${householdId}`);

    for (const table of TABLES_WITH_HOUSEHOLD_ID) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `household_id=eq.${householdId}`,
        },
        scheduleRefresh,
      );
    }

    channel.subscribe();

    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [householdId, queryClient, router, supabase]);

  return null;
}
