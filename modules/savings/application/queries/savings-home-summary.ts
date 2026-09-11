import { cache } from "react";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { SAVINGS_RPC } from "../savings-constants";
import { logSavingsFailure } from "../savings-error";

export type SavingsHomeSummary = {
  activeCount: number;
  principal: number;
  upcomingMaturityCount: number;
  actionRequiredCount: number;
  nearestMaturityDate: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapSavingsSummaryRow(value: unknown): SavingsHomeSummary | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!isRecord(row)) return null;

  const activeCount = readFiniteNumber(row.active_count);
  const principal = readFiniteNumber(row.principal);
  const upcomingMaturityCount = readFiniteNumber(row.upcoming_maturity_count);
  const actionRequiredCount = readFiniteNumber(row.action_required_count);
  const nearestMaturityDate = row.nearest_maturity_date;
  if (
    activeCount == null ||
    principal == null ||
    upcomingMaturityCount == null ||
    actionRequiredCount == null ||
    (nearestMaturityDate !== null && typeof nearestMaturityDate !== "string")
  ) {
    return null;
  }

  return {
    activeCount,
    principal,
    upcomingMaturityCount,
    actionRequiredCount,
    nearestMaturityDate,
  } satisfies SavingsHomeSummary;
}

async function loadSavingsHomeSummary(): Promise<SavingsHomeSummary | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc(SAVINGS_RPC.HOME_SUMMARY);
    if (error) {
      logSavingsFailure(error, SAVINGS_RPC.HOME_SUMMARY, {
        householdId: gate.householdId,
      });
      return null;
    }
    return mapSavingsSummaryRow(data);
  } catch (error) {
    logSavingsFailure(error, SAVINGS_RPC.HOME_SUMMARY, {
      householdId: gate.householdId,
    });
    return null;
  }
}

export const getSavingsHomeSummary = cache(loadSavingsHomeSummary);
