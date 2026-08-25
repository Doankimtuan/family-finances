import { cache } from "react";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  CycleStatus,
  SavingStatus,
  SAVINGS_OPERATION,
} from "../savings-constants";
import { logSavingsFailure } from "../savings-error";

export type SavingsHomeSummary = {
  activeCount: number;
  principal: number;
  upcomingMaturityCount: number;
  actionRequiredCount: number;
  nearestMaturityDate: string | null;
};

type HomeSavingRow = { id: string; status: string };
type HomeCycleRow = {
  saving_id: string;
  cycle_number: number;
  end_date: string;
  principal: number | string;
  status: string;
};

async function loadSavingsHomeSummary(): Promise<SavingsHomeSummary | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: savingRows, error: savingError } = await supabase
      .from("savings")
      .select("id, status")
      .eq("household_id", gate.householdId)
      .neq("status", SavingStatus.CLOSED)
      .neq("status", SavingStatus.EARLY_CLOSED);
    if (savingError) return null;
    const savings = (savingRows ?? []) as HomeSavingRow[];
    if (savings.length === 0) {
      return {
        activeCount: 0,
        principal: 0,
        upcomingMaturityCount: 0,
        actionRequiredCount: 0,
        nearestMaturityDate: null,
      };
    }
    const { data: cycleRows, error: cycleError } = await supabase
      .from("saving_cycles")
      .select("saving_id, cycle_number, end_date, principal, status")
      .in(
        "saving_id",
        savings.map((saving) => saving.id),
      )
      .in("status", [CycleStatus.ACTIVE, CycleStatus.MATURED])
      .order("cycle_number", { ascending: false });
    if (cycleError) return null;

    const currentBySaving = new Map<string, HomeCycleRow>();
    for (const row of (cycleRows ?? []) as HomeCycleRow[]) {
      const current = currentBySaving.get(row.saving_id);
      if (
        !current ||
        row.status === CycleStatus.ACTIVE ||
        row.cycle_number > current.cycle_number
      ) {
        currentBySaving.set(row.saving_id, row);
      }
    }
    const current = [...currentBySaving.values()];
    const active = current.filter(
      (cycle) => cycle.status === CycleStatus.ACTIVE,
    );
    const matured = current.filter(
      (cycle) => cycle.status === CycleStatus.MATURED,
    );
    return {
      activeCount: active.length,
      principal: active.reduce(
        (sum, cycle) => sum + Number(cycle.principal),
        0,
      ),
      upcomingMaturityCount: active.length,
      actionRequiredCount: matured.length,
      nearestMaturityDate:
        active.map((cycle) => cycle.end_date).sort()[0] ?? null,
    };
  } catch (error) {
    logSavingsFailure(error, SAVINGS_OPERATION.LIST_SAVINGS, {
      householdId: gate.householdId,
    });
    return null;
  }
}

export const getSavingsHomeSummary = cache(loadSavingsHomeSummary);
