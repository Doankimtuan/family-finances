import { cache } from "react";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { listActiveMembershipIds } from "@/modules/tenancy/application/list-active-membership-ids";
import {
  mapSavingRow,
  mapSavingCycleRow,
  selectCurrentSavingCycle,
  type Saving,
  type SavingCycle,
  type SavingsFinancialActivity,
} from "../savings-types";
import {
  InterestCalcMethod,
  CycleStatus,
  SavingStatus,
  SettlementRule,
  SAVINGS_OPERATION,
} from "../savings-constants";
import { computeAccruedInterest } from "../savings-interest";
import { listProviderPackages } from "../savings-provider-registry";
import { logSavingsFailure } from "../savings-error";

const SAVING_CYCLE_SELECT =
  "id, saving_id, cycle_number, start_date, end_date, principal, locked_rate, package_snapshot, accrued_interest, settlement_result, renewal_decision, status, funding_transaction_id, settlement_transaction_id, previous_cycle_id, next_cycle_id, created_at";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;
type SavingCycleRow = Parameters<typeof mapSavingCycleRow>[0];

async function loadCycleRows(
  supabase: SupabaseServerClient,
  savingIds: readonly string[],
): Promise<SavingCycleRow[] | null> {
  if (savingIds.length === 0) return [];

  const { data, error } = await supabase
    .from("saving_cycles")
    .select(SAVING_CYCLE_SELECT)
    .in("saving_id", [...savingIds])
    .order("cycle_number", { ascending: false });

  return error ? null : ((data ?? []) as SavingCycleRow[]);
}

async function loadCycleRowsForSaving(
  supabase: SupabaseServerClient,
  savingId: string,
): Promise<SavingCycleRow[]> {
  const { data, error } = await supabase
    .from("saving_cycles")
    .select(SAVING_CYCLE_SELECT)
    .eq("saving_id", savingId)
    .order("cycle_number", { ascending: false });

  if (error) throw error;
  return (data ?? []) as SavingCycleRow[];
}

async function setMaturityActionRequired(saving: Saving) {
  if (
    saving.status !== SavingStatus.MATURED ||
    saving.maturityInstruction.strategy === SettlementRule.WITHDRAW_EVERYTHING
  ) {
    return;
  }
  const targetPackageId =
    saving.maturityInstruction.targetPackageId ??
    saving.productSnapshot.packageId ??
    null;
  const packages = await listProviderPackages(saving.providerId);
  saving.maturityActionRequired =
    !targetPackageId ||
    !(packages ?? []).some(
      (pkg) =>
        pkg.id === targetPackageId && pkg.isActive && pkg.renewableAvailable,
    );
}

async function loadSavings(): Promise<Saving[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("savings")
      .select(
        `id, household_id, status, funding_account_id, settlement_account_id,
         provider_id, product_name, product_snapshot, renewal_policy, renewal_config, maturity_instruction, created_at, financial_scope, owner_membership_id,
         funding_accounts:funding_account_id(name),
         settlement_accounts:settlement_account_id(name),
         saving_providers:provider_id(display_name, provider_key, saving_type)`,
      )
      .eq("household_id", gate.householdId)
      .order("created_at", { ascending: false });

    if (error) {
      logSavingsFailure(error, SAVINGS_OPERATION.LIST_SAVINGS, {
        householdId: gate.householdId,
      });
      return null;
    }

    const activeOwnerMembershipIds = await listActiveMembershipIds(
      supabase,
      gate.householdId,
      (data ?? [])
        .map((row) => row.owner_membership_id)
        .filter((id): id is string => id != null),
    );
    const savings = (data ?? []).map((row) =>
      mapSavingRow(
        row,
        gate.membershipId,
        activeOwnerMembershipIds ?? undefined,
      ),
    );

    const cycleRows = await loadCycleRows(
      supabase,
      savings.map((saving) => saving.id),
    );
    const rows =
      cycleRows ??
      (
        await Promise.all(
          savings.map((saving) => loadCycleRowsForSaving(supabase, saving.id)),
        )
      ).flat();
    const cyclesBySavingId = new Map<string, SavingCycle[]>();

    for (const row of rows) {
      const cycles = cyclesBySavingId.get(row.saving_id) ?? [];
      cycles.push(mapSavingCycleRow(row));
      cyclesBySavingId.set(row.saving_id, cycles);
    }

    // Enrich with the current lifecycle cycle, not merely the newest row.
    await Promise.all(
      savings.map(async (saving) => {
        const cycles = cyclesBySavingId.get(saving.id) ?? [];
        if (cycles.length > 0) {
          const cycle = selectCurrentSavingCycle(cycles);
          if (!cycle) return;

          // Compute current accrued interest for active cycles
          if (cycle.status === CycleStatus.ACTIVE) {
            const accrued = computeAccruedInterest({
              principal: cycle.principal,
              annualRate: cycle.lockedRate,
              startDate: cycle.startDate,
              endDate: cycle.endDate,
              method:
                cycle.packageSnapshot.interestCalculationMethod ||
                saving.productSnapshot.interestCalculationMethod ||
                InterestCalcMethod.SIMPLE,
            });
            cycle.accruedInterest = accrued.totalInterest;
          }

          saving.latestCycle = cycle;
        }
        await setMaturityActionRequired(saving);
      }),
    );

    return savings;
  } catch (error) {
    logSavingsFailure(error, SAVINGS_OPERATION.LIST_SAVINGS, {
      householdId: gate.householdId,
    });
    return null;
  }
}

export const listSavings = cache(loadSavings);

export async function getSaving(savingId: string): Promise<Saving | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("savings")
      .select(
        `id, household_id, status, funding_account_id, settlement_account_id,
         provider_id, product_name, product_snapshot, renewal_policy, renewal_config, maturity_instruction, created_at, financial_scope, owner_membership_id,
         funding_accounts:funding_account_id(name),
         settlement_accounts:settlement_account_id(name),
         saving_providers:provider_id(display_name, provider_key, saving_type)`,
      )
      .eq("id", savingId)
      .eq("household_id", gate.householdId)
      .maybeSingle();

    if (error) {
      logSavingsFailure(error, SAVINGS_OPERATION.GET_SAVING, {
        householdId: gate.householdId,
        savingId,
      });
      return null;
    }
    if (!data) return null;

    const activeOwnerMembershipIds = await listActiveMembershipIds(
      supabase,
      gate.householdId,
      data.owner_membership_id ? [data.owner_membership_id] : [],
    );
    const saving = mapSavingRow(
      data,
      gate.membershipId,
      activeOwnerMembershipIds ?? undefined,
    );

    // Load all cycles
    const { data: cycles } = await supabase
      .from("saving_cycles")
      .select(SAVING_CYCLE_SELECT)
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
              cycle.packageSnapshot.interestCalculationMethod ||
              saving.productSnapshot.interestCalculationMethod ||
              InterestCalcMethod.SIMPLE,
          });
          cycle.accruedInterest = accrued.totalInterest;
        }
      }

      saving.latestCycle = selectCurrentSavingCycle(mappedCycles);
    }

    await setMaturityActionRequired(saving);

    return saving;
  } catch (error) {
    logSavingsFailure(error, SAVINGS_OPERATION.GET_SAVING, {
      householdId: gate.householdId,
      savingId,
    });
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
      .select(SAVING_CYCLE_SELECT)
      .eq("saving_id", savingId)
      .order("cycle_number", { ascending: true });

    if (error) {
      logSavingsFailure(error, SAVINGS_OPERATION.LIST_SAVING_CYCLES, {
        householdId: gate.householdId,
        savingId,
      });
      return null;
    }

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

    return cycles.sort(
      (left, right) =>
        right.cycleNumber - left.cycleNumber ||
        right.createdAt.localeCompare(left.createdAt),
    );
  } catch (error) {
    logSavingsFailure(error, SAVINGS_OPERATION.LIST_SAVING_CYCLES, {
      householdId: gate.householdId,
      savingId,
    });
    return null;
  }
}

export async function listSavingsFinancialActivities(
  savingId: string,
  cycles: readonly SavingCycle[],
): Promise<SavingsFinancialActivity[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: saving } = await supabase
      .from("savings")
      .select("id")
      .eq("id", savingId)
      .eq("household_id", gate.householdId)
      .maybeSingle();
    if (!saving) return null;

    const ids = new Set<string>();
    for (const cycle of cycles) {
      if (cycle.fundingTransactionId) ids.add(cycle.fundingTransactionId);
      if (cycle.settlementTransactionId) ids.add(cycle.settlementTransactionId);
      const result = cycle.settlementResult;
      for (const id of [
        result?.interestTransactionId,
        result?.taxTransactionId,
        result?.feeTransactionId,
      ]) {
        if (id) ids.add(id);
      }
    }
    if (ids.size === 0) return [];

    const select =
      "id, type, amount, currency, transaction_date, note, transfer_group_id, savings_event_kind";
    const { data: seedRows, error: seedError } = await supabase
      .from("transactions")
      .select(select)
      .eq("household_id", gate.householdId)
      .in("id", [...ids]);
    if (seedError) {
      logSavingsFailure(
        seedError,
        SAVINGS_OPERATION.LIST_SAVINGS_FINANCIAL_ACTIVITIES,
        { householdId: gate.householdId, savingId },
      );
      return null;
    }

    const groups = new Set(
      (seedRows ?? [])
        .map((row) => row.transfer_group_id)
        .filter((id): id is string => Boolean(id)),
    );
    const { data: groupRows, error: groupError } = groups.size
      ? await supabase
          .from("transactions")
          .select(select)
          .eq("household_id", gate.householdId)
          .in("transfer_group_id", [...groups])
      : { data: [], error: null };
    if (groupError) {
      logSavingsFailure(
        groupError,
        SAVINGS_OPERATION.LIST_SAVINGS_FINANCIAL_ACTIVITIES,
        { householdId: gate.householdId, savingId },
      );
      return null;
    }

    const rows = [...(seedRows ?? []), ...(groupRows ?? [])];
    const unique = new Map<string, (typeof rows)[number]>();
    for (const row of rows) unique.set(row.id, row);

    const activities = new Map<string, SavingsFinancialActivity>();
    for (const row of unique.values()) {
      if (!row.savings_event_kind) continue;
      const key = row.transfer_group_id
        ? `${row.transfer_group_id}:${row.savings_event_kind}`
        : row.id;
      if (activities.has(key)) continue;
      activities.set(key, {
        id: key,
        eventKind: row.savings_event_kind,
        amount: Number(row.amount),
        currency: row.currency,
        date: row.transaction_date,
        note: row.note,
      });
    }
    return [...activities.values()].sort((left, right) =>
      right.date.localeCompare(left.date),
    );
  } catch (error) {
    logSavingsFailure(
      error,
      SAVINGS_OPERATION.LIST_SAVINGS_FINANCIAL_ACTIVITIES,
      { householdId: gate.householdId, savingId },
    );
    return null;
  }
}
