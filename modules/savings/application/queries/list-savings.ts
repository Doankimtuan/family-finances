import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  mapSavingRow,
  mapSavingCycleRow,
  type Saving,
  type SavingCycle,
} from "../savings-types";
import { SavingStatus, InterestCalcMethod, CycleStatus } from "../savings-constants";
import { computeAccruedInterest } from "../savings-interest";

export async function listSavings(): Promise<Saving[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("savings")
      .select(
        `id, household_id, status, funding_account_id, settlement_account_id,
         provider_id, product_name, product_snapshot, renewal_policy, renewal_config, created_at,
         funding_accounts:funding_account_id(name),
         settlement_accounts:settlement_account_id(name),
         saving_providers:provider_id(display_name, provider_key, saving_type)`,
      )
      .eq("household_id", gate.householdId)
      .neq("status", SavingStatus.CLOSED)
      .order("created_at", { ascending: false });

    if (error) return null;

    const savings = (data ?? []).map(mapSavingRow);

    // Enrich with latest cycle
    for (const saving of savings) {
      const { data: cycles } = await supabase
        .from("saving_cycles")
        .select(
          "id, saving_id, cycle_number, start_date, end_date, principal, locked_rate, package_snapshot, accrued_interest, settlement_result, renewal_decision, status, funding_transaction_id, settlement_transaction_id, created_at",
        )
        .eq("saving_id", saving.id)
        .order("cycle_number", { ascending: false })
        .limit(1);

      if (cycles && cycles.length > 0) {
        const cycle = mapSavingCycleRow(cycles[0]);

        // Compute current accrued interest for active cycles
        if (cycle.status === CycleStatus.ACTIVE) {
          const accrued = computeAccruedInterest({
            principal: cycle.principal,
            annualRate: cycle.lockedRate,
            startDate: cycle.startDate,
            endDate: cycle.endDate,
            method:
              saving.productSnapshot.interestCalculationMethod ||
              InterestCalcMethod.SIMPLE,
          });
          cycle.accruedInterest = accrued.totalInterest;
        }

        saving.latestCycle = cycle;
      }
    }

    return savings;
  } catch {
    return null;
  }
}

export async function getSaving(
  savingId: string,
): Promise<Saving | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("savings")
      .select(
        `id, household_id, status, funding_account_id, settlement_account_id,
         provider_id, product_name, product_snapshot, renewal_policy, renewal_config, created_at,
         funding_accounts:funding_account_id(name),
         settlement_accounts:settlement_account_id(name),
         saving_providers:provider_id(display_name, provider_key, saving_type)`,
      )
      .eq("id", savingId)
      .eq("household_id", gate.householdId)
      .maybeSingle();

    if (error || !data) return null;

    const saving = mapSavingRow(data);

    // Load all cycles
    const { data: cycles } = await supabase
      .from("saving_cycles")
      .select(
        "id, saving_id, cycle_number, start_date, end_date, principal, locked_rate, package_snapshot, accrued_interest, settlement_result, renewal_decision, status, funding_transaction_id, settlement_transaction_id, created_at",
      )
      .eq("saving_id", saving.id)
      .order("cycle_number", { ascending: true });

    if (cycles && cycles.length > 0) {
      const mappedCycles = cycles.map(mapSavingCycleRow);

      // Compute current accrued interest for active cycles
      for (const cycle of mappedCycles) {
        if (cycle.status === CycleStatus.ACTIVE) {
          const accrued = computeAccruedInterest({
            principal: cycle.principal,
            annualRate: cycle.lockedRate,
            startDate: cycle.startDate,
            endDate: cycle.endDate,
            method:
              saving.productSnapshot.interestCalculationMethod ||
              InterestCalcMethod.SIMPLE,
          });
          cycle.accruedInterest = accrued.totalInterest;
        }
      }

      saving.latestCycle =
        mappedCycles[mappedCycles.length - 1] ?? null;
    }

    return saving;
  } catch {
    return null;
  }
}

export async function listSavingCycles(
  savingId: string,
): Promise<SavingCycle[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();

    // Verify ownership
    const { data: saving } = await supabase
      .from("savings")
      .select("id, product_snapshot")
      .eq("id", savingId)
      .eq("household_id", gate.householdId)
      .maybeSingle();

    if (!saving) return null;

    const { data, error } = await supabase
      .from("saving_cycles")
      .select(
        "id, saving_id, cycle_number, start_date, end_date, principal, locked_rate, package_snapshot, accrued_interest, settlement_result, renewal_decision, status, funding_transaction_id, settlement_transaction_id, created_at",
      )
      .eq("saving_id", savingId)
      .order("cycle_number", { ascending: true });

    if (error) return null;

    const cycles = (data ?? []).map(mapSavingCycleRow);

    // Compute current accrued interest for active cycles
    const productSnapshot = saving.product_snapshot as {
      interestCalculationMethod?: string;
    };
    for (const cycle of cycles) {
      if (cycle.status === CycleStatus.ACTIVE) {
        const accrued = computeAccruedInterest({
          principal: cycle.principal,
          annualRate: cycle.lockedRate,
          startDate: cycle.startDate,
          endDate: cycle.endDate,
          method:
            (productSnapshot.interestCalculationMethod as
              | typeof InterestCalcMethod.SIMPLE
              | typeof InterestCalcMethod.COMPOUND_DAILY
              | typeof InterestCalcMethod.COMPOUND_MONTHLY) ||
            InterestCalcMethod.SIMPLE,
        });
        cycle.accruedInterest = accrued.totalInterest;
      }
    }

    return cycles;
  } catch {
    return null;
  }
}
