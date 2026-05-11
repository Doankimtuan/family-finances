import { SupabaseClient } from "@supabase/supabase-js";
import { toMonthStart } from "../_lib/utils";
import {
  MonthClosePreview,
  MonthCloseResult,
  JarBalanceSummary,
  OverspendCoverageItem,
  RolloverItem,
  CreateMovementCommand,
  HouseholdPolicyContext,
} from "./types";
import { createJarMovement } from "../_lib/core";
import { createJarEvents } from "./events";
import { validateMovementCommand } from "./validation";
import { fetchHouseholdPolicy } from "./allocation-engine";

export async function previewMonthClose(
  supabase: SupabaseClient,
  householdId: string,
  month: string,
): Promise<MonthClosePreview> {
  const monthStart = toMonthStart(month);
  const policy = await fetchHouseholdPolicy(supabase, householdId);

  const [jarsResult, balancesResult, plansResult] = await Promise.all([
    supabase
      .from("jars")
      .select("id, name")
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from("jar_balances_monthly")
      .select("*")
      .eq("household_id", householdId)
      .eq("month", monthStart),
    supabase
      .from("jar_month_plans")
      .select("jar_id, fixed_amount")
      .eq("household_id", householdId)
      .eq("month", monthStart),
  ]);

  if (jarsResult.error) throw new Error(jarsResult.error.message);
  if (balancesResult.error) throw new Error(balancesResult.error.message);
  if (plansResult.error) throw new Error(plansResult.error.message);

  const jars = (jarsResult.data ?? []) as Array<{ id: string; name: string }>;
  const balanceMap = new Map(
    ((balancesResult.data ?? []) as Array<Record<string, unknown>>).map(
      (row) => [String(row.jar_id), row],
    ),
  );
  const planMap = new Map(
    ((plansResult.data ?? []) as Array<{ jar_id: string; fixed_amount: number }>).map(
      (row) => [row.jar_id, row],
    ),
  );

  const jarBalances: JarBalanceSummary[] = jars.map((jar) => {
    const balance = balanceMap.get(jar.id);
    const plan = planMap.get(jar.id);

    const inflow = Math.round(Number(balance?.inflow_amount ?? 0));
    const outflow = Math.round(Number(balance?.outflow_amount ?? 0));
    const plannedAmount = Math.round(Number(plan?.fixed_amount ?? 0));

    return {
      jarId: jar.id,
      jarName: jar.name,
      openingBalance: 0,
      allocatedAmount: inflow,
      spentAmount: outflow,
      transferIn: 0,
      transferOut: 0,
      closingBalanceBeforeRollover: inflow - outflow,
      plannedAmount,
    };
  });

  const overspendCoverage = computeOverspendCoverage(jarBalances, policy);
  const rollovers = computeRollovers(jarBalances);

  const closeRunResult = await supabase
    .from("jar_month_close_runs")
    .upsert(
      {
        household_id: householdId,
        month: monthStart,
        status: "draft",
        preview_json: {
          jarBalances,
          overspendCoverage,
          rollovers,
        },
      },
      { onConflict: "household_id,month" },
    )
    .select("id")
    .single();

  if (closeRunResult.error || !closeRunResult.data?.id) {
    throw new Error(closeRunResult.error?.message ?? "Failed to create close run.");
  }

  return {
    month: monthStart,
    closeRunId: closeRunResult.data.id,
    jarBalances,
    overspendCoverage,
    rollovers,
    totalSurplus: rollovers
      .filter((r) => r.action !== "none")
      .reduce((sum, r) => sum + r.amount, 0),
    totalDeficit: overspendCoverage.reduce(
      (sum, c) => sum + c.deficitAmount,
      0,
    ),
  };
}

function computeOverspendCoverage(
  balances: JarBalanceSummary[],
  policy: HouseholdPolicyContext,
): OverspendCoverageItem[] {
  if (policy.overspendPolicy === "allow_negative") return [];

  const negativeJars = balances
    .filter((b) => b.closingBalanceBeforeRollover < 0)
    .sort((a, b) => a.closingBalanceBeforeRollover - b.closingBalanceBeforeRollover);

  const positiveJars = balances
    .filter((b) => b.closingBalanceBeforeRollover > 0)
    .sort((a, b) => b.closingBalanceBeforeRollover - a.closingBalanceBeforeRollover);

  const coverage: OverspendCoverageItem[] = [];

  for (const deficitJar of negativeJars) {
    let remainingDeficit = Math.abs(deficitJar.closingBalanceBeforeRollover);

    for (const sourceJar of positiveJars) {
      if (remainingDeficit <= 0) break;

      const available = sourceJar.closingBalanceBeforeRollover;
      if (available <= 0) continue;

      const coverAmount = Math.min(remainingDeficit, available);

      coverage.push({
        deficitJarId: deficitJar.jarId,
        deficitJarName: deficitJar.jarName,
        deficitAmount: Math.abs(deficitJar.closingBalanceBeforeRollover),
        sourceJarId: sourceJar.jarId,
        sourceJarName: sourceJar.jarName,
        coverAmount,
        remainingDeficit: remainingDeficit - coverAmount,
      });

      sourceJar.closingBalanceBeforeRollover -= coverAmount;
      remainingDeficit -= coverAmount;
    }
  }

  return coverage;
}

function computeRollovers(balances: JarBalanceSummary[]): RolloverItem[] {
  const rollovers: RolloverItem[] = [];

  for (const balance of balances) {
    const surplus = balance.closingBalanceBeforeRollover;

    if (surplus <= 0) {
      rollovers.push({
        jarId: balance.jarId,
        jarName: balance.jarName,
        surplus: 0,
        action: "none",
        amount: 0,
      });
      continue;
    }

    rollovers.push({
      jarId: balance.jarId,
      jarName: balance.jarName,
      surplus,
      action: "carry_forward",
      amount: surplus,
    });
  }

  return rollovers;
}

export async function approveMonthClose(
  supabase: SupabaseClient,
  householdId: string,
  userId: string,
  month: string,
  closeRunId: string,
  userRollovers?: Record<string, "carry_forward" | "sweep_out" | "none">,
  userCoverage?: Record<string, string>,
): Promise<MonthCloseResult> {
  const monthStart = toMonthStart(month);

  const closeRunResult = await supabase
    .from("jar_month_close_runs")
    .select("*")
    .eq("household_id", householdId)
    .eq("id", closeRunId)
    .eq("month", monthStart)
    .maybeSingle();

  if (closeRunResult.error || !closeRunResult.data) {
    throw new Error("Close run not found.");
  }

  const closeRun = closeRunResult.data as Record<string, unknown>;
  if (closeRun.status === "approved") {
    throw new Error("Month is already closed.");
  }

  await supabase
    .from("jar_month_close_runs")
    .update({ status: "processing" })
    .eq("id", closeRunId);

  const preview = closeRun.preview_json as Record<string, unknown>;
  const overspendCoverage = (preview.overspendCoverage ?? []) as OverspendCoverageItem[];
  const rollovers = (preview.rollovers ?? []) as RolloverItem[];
  const jarBalances = (preview.jarBalances ?? []) as JarBalanceSummary[];

  // Build jar balance map for validation
  const jarBalanceMap = new Map(
    jarBalances.map((jb) => [jb.jarId, jb.closingBalanceBeforeRollover])
  );

  // Use user selections if provided, otherwise use preview suggestions
  const coverageItems = userCoverage ? buildCoverageFromUserSelection(userCoverage, jarBalances) : overspendCoverage;
  const rolloverItems = userRollovers ? buildRolloversFromUserSelection(userRollovers, jarBalances) : rollovers;

  // Server-side validation: ensure total outflows from any jar don't exceed its closing balance
  const jarOutflows = new Map<string, number>();
  
  // Calculate outflows from coverage (source jars)
  for (const cover of coverageItems) {
    const current = jarOutflows.get(cover.sourceJarId) || 0;
    jarOutflows.set(cover.sourceJarId, current + cover.coverAmount);
  }
  
  // Calculate outflows from sweep_out rollovers
  for (const rollover of rolloverItems) {
    if (rollover.action === "sweep_out") {
      const current = jarOutflows.get(rollover.jarId) || 0;
      jarOutflows.set(rollover.jarId, current + rollover.amount);
    }
  }
  
  // Validate that outflows don't exceed closing balances
  for (const [jarId, outflow] of jarOutflows.entries()) {
    const closingBalance = jarBalanceMap.get(jarId) || 0;
    if (outflow > closingBalance) {
      throw new Error(
        `Validation error: Cannot sweep ${outflow} from jar with closing balance ${closingBalance}. ` +
        `Jar ID: ${jarId}`
      );
    }
  }

  const movements: Array<{ id: string; idempotencyKey: string }> = [];
  const events: Array<{ id: string; idempotencyKey: string }> = [];
  const snapshots: string[] = [];

  for (const cover of coverageItems) {
    const outCmd: CreateMovementCommand = {
      householdId,
      jarId: cover.sourceJarId,
      movementDate: monthStart,
      amount: cover.coverAmount,
      balanceDelta: -1,
      locationFrom: "cash",
      locationTo: null,
      sourceType: "manual_adjustment",
      sourceId: closeRunId,
      sourceLineKey: `cover-out-${cover.deficitJarId}`,
      movementType: "overspend_cover_out",
      idempotencyKey: `month_close:${monthStart}:cover_out:${cover.sourceJarId}:${cover.deficitJarId}`,
      note: `Cover deficit for ${cover.deficitJarName}`,
      createdBy: userId,
    };

    const outValidation = await validateMovementCommand(supabase, outCmd);
    if (outValidation.ok) {
      const id = await createJarMovement(supabase, outCmd);
      movements.push({ id, idempotencyKey: outCmd.idempotencyKey });
    }

    const inCmd: CreateMovementCommand = {
      householdId,
      jarId: cover.deficitJarId,
      movementDate: monthStart,
      amount: cover.coverAmount,
      balanceDelta: 1,
      locationFrom: null,
      locationTo: "cash",
      sourceType: "manual_adjustment",
      sourceId: closeRunId,
      sourceLineKey: `cover-in-${cover.sourceJarId}`,
      movementType: "overspend_cover_in",
      idempotencyKey: `month_close:${monthStart}:cover_in:${cover.deficitJarId}:${cover.sourceJarId}`,
      note: `Covered from ${cover.sourceJarName}`,
      createdBy: userId,
    };

    const inValidation = await validateMovementCommand(supabase, inCmd);
    if (inValidation.ok) {
      const id = await createJarMovement(supabase, inCmd);
      movements.push({ id, idempotencyKey: inCmd.idempotencyKey });
    }
  }

  for (const rollover of rolloverItems) {
    if (rollover.action === "none" || rollover.amount <= 0) continue;

    if (rollover.action === "carry_forward") {
      const cmd: CreateMovementCommand = {
        householdId,
        jarId: rollover.jarId,
        movementDate: monthStart,
        amount: rollover.amount,
        balanceDelta: 1,
        locationFrom: null,
        locationTo: "cash",
        sourceType: "manual_adjustment",
        sourceId: closeRunId,
        sourceLineKey: `rollover-carry-${rollover.jarId}`,
        movementType: "rollover_carry_forward",
        idempotencyKey: `month_close:${monthStart}:rollover_carry:${rollover.jarId}`,
        note: `Rollover from previous month`,
        createdBy: userId,
      };

      const validation = await validateMovementCommand(supabase, cmd);
      if (validation.ok) {
        const id = await createJarMovement(supabase, cmd);
        movements.push({ id, idempotencyKey: cmd.idempotencyKey });
      }
    }
  }

  for (const balance of jarBalances) {
    const snapshotResult = await supabase
      .from("jar_monthly_snapshots")
      .upsert(
        {
          household_id: householdId,
          jar_id: balance.jarId,
          month: monthStart,
          opening_balance: balance.openingBalance,
          planned_amount: balance.plannedAmount,
          allocated_amount: balance.allocatedAmount,
          spent_amount: balance.spentAmount,
          transfer_in_amount: balance.transferIn,
          transfer_out_amount: balance.transferOut,
          rollover_in_amount: 0,
          rollover_out_amount: 0,
          overspend_cover_in_amount: 0,
          overspend_cover_out_amount: 0,
          correction_amount: 0,
          closing_balance_before_rollover: balance.closingBalanceBeforeRollover,
          closing_balance: balance.closingBalanceBeforeRollover,
          closed_at: new Date().toISOString(),
          closed_by: userId,
          source_close_run_id: closeRunId,
        },
        { onConflict: "household_id,jar_id,month" },
      )
      .select("id")
      .single();

    if (snapshotResult.data?.id) {
      snapshots.push(snapshotResult.data.id);
    }
  }

  const eventCommands = [
    {
      householdId,
      jarId: null,
      eventType: "month_close.approved" as const,
      sourceType: "month_close",
      sourceId: closeRunId,
      idempotencyKey: `month_close:${monthStart}:approved`,
      actorUserId: userId,
      payload: { movementCount: movements.length, snapshotCount: snapshots.length },
    },
    {
      householdId,
      jarId: null,
      eventType: "snapshot.generated" as const,
      sourceType: "month_close",
      sourceId: closeRunId,
      idempotencyKey: `month_close:${monthStart}:snapshots`,
      actorUserId: userId,
      payload: { snapshotIds: snapshots },
    },
  ];

  const eventResults = await createJarEvents(supabase, eventCommands);
  events.push(...eventResults);

  await supabase
    .from("jar_month_close_runs")
    .update({
      status: "approved",
      approved_by: userId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", closeRunId);

  return { closeRunId, snapshots, movements, events };
}

function buildCoverageFromUserSelection(
  userCoverage: Record<string, string>,
  jarBalances: JarBalanceSummary[],
): OverspendCoverageItem[] {
  const items: OverspendCoverageItem[] = [];
  const jarBalanceMap = new Map(
    jarBalances.map((jb) => [jb.jarId, jb.closingBalanceBeforeRollover])
  );
  const jarNameMap = new Map(
    jarBalances.map((jb) => [jb.jarId, jb.jarName])
  );

  for (const [deficitJarId, sourceJarId] of Object.entries(userCoverage)) {
    if (!sourceJarId) continue; // Skip if no coverage selected

    const deficitAmount = Math.abs(jarBalanceMap.get(deficitJarId) || 0);
    const sourceBalance = jarBalanceMap.get(sourceJarId) || 0;
    
    if (deficitAmount <= 0 || sourceBalance <= 0) continue;

    const coverAmount = Math.min(deficitAmount, sourceBalance);

    items.push({
      deficitJarId,
      deficitJarName: jarNameMap.get(deficitJarId) || "",
      deficitAmount,
      sourceJarId,
      sourceJarName: jarNameMap.get(sourceJarId) || "",
      coverAmount,
      remainingDeficit: deficitAmount - coverAmount,
    });
  }

  return items;
}

function buildRolloversFromUserSelection(
  userRollovers: Record<string, "carry_forward" | "sweep_out" | "none">,
  jarBalances: JarBalanceSummary[],
): RolloverItem[] {
  const items: RolloverItem[] = [];
  const jarBalanceMap = new Map(
    jarBalances.map((jb) => [jb.jarId, jb.closingBalanceBeforeRollover])
  );
  const jarNameMap = new Map(
    jarBalances.map((jb) => [jb.jarId, jb.jarName])
  );

  for (const [jarId, action] of Object.entries(userRollovers)) {
    if (action === "none") continue;

    const surplus = jarBalanceMap.get(jarId) || 0;
    if (surplus <= 0) continue;

    items.push({
      jarId,
      jarName: jarNameMap.get(jarId) || "",
      surplus,
      action,
      amount: surplus,
    });
  }

  return items;
}
