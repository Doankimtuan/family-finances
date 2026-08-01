import { SupabaseClient } from "@supabase/supabase-js";
import { JarSuggestion } from "../_lib/types";
import { toMonthStart } from "../_lib/utils";
import { createJarMovement, upsertJarReviewQueue } from "../_lib/core";
import { resolveCategoryJarIdWithFallback } from "./rule-engine";
import { validateMovementCommand } from "./validation";
import { createJarEvent } from "./events";
import {
  AllocationResult,
  CreateMovementCommand,
  HouseholdPolicyContext,
} from "./types";

const DEFAULT_POLICY: HouseholdPolicyContext = {
  overspendPolicy: "warn",
  incomeAutoAllocate: "off",
  expenseAutoAllocate: "off",
  monthCloseMode: "manual",
};

export async function fetchHouseholdPolicy(
  supabase: SupabaseClient,
  householdId: string,
): Promise<HouseholdPolicyContext> {
  const result = await supabase
    .from("jar_household_policies")
    .select("*")
    .eq("household_id", householdId)
    .maybeSingle();

  if (result.error || !result.data) return DEFAULT_POLICY;

  return {
    overspendPolicy: result.data.overspend_policy as HouseholdPolicyContext["overspendPolicy"],
    incomeAutoAllocate: result.data.income_auto_allocate as HouseholdPolicyContext["incomeAutoAllocate"],
    expenseAutoAllocate: result.data.expense_auto_allocate as HouseholdPolicyContext["expenseAutoAllocate"],
    monthCloseMode: result.data.month_close_mode as HouseholdPolicyContext["monthCloseMode"],
  };
}

export async function computeIncomeAllocationSuggestions(
  supabase: SupabaseClient,
  householdId: string,
  amount: number,
  movementDate: string,
): Promise<JarSuggestion[]> {
  const month = toMonthStart(movementDate);
  const [plansResult, jarsResult, balancesResult] = await Promise.all([
    supabase
      .from("jar_month_plans")
      .select("jar_id, fixed_amount, income_percent, priority")
      .eq("household_id", householdId)
      .eq("month", month)
      .order("priority", { ascending: true }),
    supabase
      .from("jars")
      .select("id, name")
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .is("deleted_at", null),
    supabase
      .from("jar_balances_monthly")
      .select("jar_id, inflow_amount")
      .eq("household_id", householdId)
      .eq("month", month),
  ]);

  if (plansResult.error) throw new Error(plansResult.error.message);
  if (jarsResult.error) throw new Error(jarsResult.error.message);
  if (balancesResult.error) throw new Error(balancesResult.error.message);

  const jarNameMap = new Map(
    (jarsResult.data ?? []).map((row) => [row.id, row.name]),
  );
  const alreadyInflowMap = new Map(
    (
      (balancesResult.data ?? []) as Array<{
        jar_id: string;
        inflow_amount: number;
      }>
    ).map((row) => [row.jar_id, Math.round(Number(row.inflow_amount ?? 0))]),
  );

  let remaining = Math.round(amount);
  const suggestions: JarSuggestion[] = [];
  const plans = (plansResult.data ?? []) as Array<{
    jar_id: string;
    fixed_amount: number;
    income_percent: number;
    priority: number;
  }>;

  const percentPlans = plans
    .filter((row) => Number(row.income_percent ?? 0) > 0)
    .sort((a, b) => a.priority - b.priority);

  for (const plan of percentPlans) {
    const suggested = Math.round(
      (remaining * Number(plan.income_percent ?? 0)) / 100,
    );
    if (suggested <= 0) continue;
    suggestions.push({
      jarId: plan.jar_id,
      jarName: jarNameMap.get(plan.jar_id) ?? "Jar",
      amount: suggested,
      reason: `Theo ty le ${Number(plan.income_percent ?? 0).toFixed(0)}%`,
    });
  }

  const percentAllocated = suggestions.reduce((sum, row) => sum + row.amount, 0);
  remaining = Math.max(0, Math.round(amount) - percentAllocated);

  const fixedPlans = plans
    .filter((row) => Number(row.fixed_amount ?? 0) > 0)
    .sort((a, b) => a.priority - b.priority);

  for (const plan of fixedPlans) {
    const currentMonthInflow = alreadyInflowMap.get(plan.jar_id) ?? 0;
    const gap = Math.max(
      0,
      Math.round(Number(plan.fixed_amount ?? 0)) - currentMonthInflow,
    );
    if (gap <= 0 || remaining <= 0) continue;
    const suggested = Math.min(gap, remaining);
    suggestions.push({
      jarId: plan.jar_id,
      jarName: jarNameMap.get(plan.jar_id) ?? "Jar",
      amount: suggested,
      reason: "Bo sung muc tieu thang",
    });
    remaining -= suggested;
  }

  return suggestions.filter((row) => row.amount > 0);
}

export async function allocateExpenseTransaction(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    userId: string;
    transactionId: string;
    amount: number;
    transactionDate: string;
    categoryId: string | null;
    description?: string | null;
  },
): Promise<AllocationResult> {
  const policy = await fetchHouseholdPolicy(supabase, input.householdId);

  if (policy.expenseAutoAllocate === "off") {
    const reviewId = await upsertJarReviewQueue(supabase, {
      householdId: input.householdId,
      sourceType: "expense_transaction",
      sourceId: input.transactionId,
      movementDate: input.transactionDate,
      amount: input.amount,
      contextJson: {
        transactionType: "expense",
        categoryId: input.categoryId,
        description: input.description ?? null,
      },
    });

    const event = await createJarEvent(supabase, {
      householdId: input.householdId,
      jarId: null,
      eventType: "allocation.review_created",
      sourceType: "expense_transaction",
      sourceId: input.transactionId,
      idempotencyKey: `expense_transaction:${input.transactionId}:review_created`,
      actorUserId: input.userId,
      payload: { reason: "expense_auto_allocate is off" },
    });

    return { queued: true, reviewId, movements: [], events: [event] };
  }

  const jarId = await resolveCategoryJarIdWithFallback(
    supabase,
    input.householdId,
    input.categoryId,
  );

  if (jarId) {
    const movementCmd: CreateMovementCommand = {
      householdId: input.householdId,
      jarId,
      movementDate: input.transactionDate,
      amount: input.amount,
      balanceDelta: -1,
      locationFrom: "cash",
      locationTo: "expense",
      sourceType: "expense_transaction",
      sourceId: input.transactionId,
      sourceLineKey: "auto_rule",
      movementType: "expense_spend",
      idempotencyKey: `expense_transaction:${input.transactionId}:auto_rule`,
      relatedTransactionId: input.transactionId,
      note: input.description ?? null,
      createdBy: input.userId,
    };

    const validation = await validateMovementCommand(supabase, movementCmd);
    if (!validation.ok) {
      const reviewId = await upsertJarReviewQueue(supabase, {
        householdId: input.householdId,
        sourceType: "expense_transaction",
        sourceId: input.transactionId,
        movementDate: input.transactionDate,
        amount: input.amount,
        contextJson: {
          transactionType: "expense",
          categoryId: input.categoryId,
          description: input.description ?? null,
          validationErrors: validation.errors,
        },
      });

      const event = await createJarEvent(supabase, {
        householdId: input.householdId,
        jarId: null,
        eventType: "allocation.review_created",
        sourceType: "expense_transaction",
        sourceId: input.transactionId,
        idempotencyKey: `expense_transaction:${input.transactionId}:review_created`,
        actorUserId: input.userId,
        payload: { reason: "validation_failed", errors: validation.errors },
      });

      return { queued: true, reviewId, movements: [], events: [event] };
    }

    const movementId = await createJarMovement(supabase, movementCmd);

    const event = await createJarEvent(supabase, {
      householdId: input.householdId,
      jarId,
      eventType: "allocation.auto_resolved",
      sourceType: "expense_transaction",
      sourceId: input.transactionId,
      idempotencyKey: `expense_transaction:${input.transactionId}:auto_resolved`,
      actorUserId: input.userId,
      payload: {
        categoryId: input.categoryId,
        description: input.description ?? null,
      },
    });

    return {
      queued: false,
      movements: [{ id: movementId, idempotencyKey: movementCmd.idempotencyKey }],
      events: [event],
    };
  }

  const reviewId = await upsertJarReviewQueue(supabase, {
    householdId: input.householdId,
    sourceType: "expense_transaction",
    sourceId: input.transactionId,
    movementDate: input.transactionDate,
    amount: input.amount,
    contextJson: {
      transactionType: "expense",
      categoryId: input.categoryId,
      description: input.description ?? null,
    },
  });

  const event = await createJarEvent(supabase, {
    householdId: input.householdId,
    jarId: null,
    eventType: "allocation.review_created",
    sourceType: "expense_transaction",
    sourceId: input.transactionId,
    idempotencyKey: `expense_transaction:${input.transactionId}:review_created`,
    actorUserId: input.userId,
    payload: { reason: "no_category_mapping" },
  });

  return { queued: true, reviewId, movements: [], events: [event] };
}

export async function allocateIncomeTransaction(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    userId: string;
    transactionId: string;
    amount: number;
    transactionDate: string;
    categoryId: string | null;
    description?: string | null;
  },
): Promise<AllocationResult> {
  const policy = await fetchHouseholdPolicy(supabase, input.householdId);
  const suggestions = await computeIncomeAllocationSuggestions(
    supabase,
    input.householdId,
    input.amount,
    input.transactionDate,
  );

  if (
    policy.incomeAutoAllocate === "auto_high_confidence" &&
    suggestions.length > 0
  ) {
    const movements: Array<{ id: string; idempotencyKey: string }> = [];

    for (const [index, suggestion] of suggestions.entries()) {
      const movementCmd: CreateMovementCommand = {
        householdId: input.householdId,
        jarId: suggestion.jarId,
        movementDate: input.transactionDate,
        amount: suggestion.amount,
        balanceDelta: 1,
        locationFrom: "external",
        locationTo: "cash",
        sourceType: "income_transaction",
        sourceId: input.transactionId,
        sourceLineKey: `auto-${index}`,
        movementType: "allocation_income",
        idempotencyKey: `income_transaction:${input.transactionId}:auto-${index}`,
        relatedTransactionId: input.transactionId,
        note: input.description ?? null,
        createdBy: input.userId,
      };

      const validation = await validateMovementCommand(supabase, movementCmd);
      if (!validation.ok) continue;

      const movementId = await createJarMovement(supabase, movementCmd);
      movements.push({ id: movementId, idempotencyKey: movementCmd.idempotencyKey });
    }

    const event = await createJarEvent(supabase, {
      householdId: input.householdId,
      jarId: null,
      eventType: "allocation.auto_resolved",
      sourceType: "income_transaction",
      sourceId: input.transactionId,
      idempotencyKey: `income_transaction:${input.transactionId}:auto_resolved`,
      actorUserId: input.userId,
      payload: { suggestionCount: suggestions.length, movementCount: movements.length },
    });

    return { queued: false, movements, events: [event] };
  }

  const reviewId = await upsertJarReviewQueue(supabase, {
    householdId: input.householdId,
    sourceType: "income_transaction",
    sourceId: input.transactionId,
    movementDate: input.transactionDate,
    amount: input.amount,
    suggestedAllocations: suggestions,
    contextJson: {
      transactionType: "income",
      categoryId: input.categoryId,
      description: input.description ?? null,
    },
  });

  const event = await createJarEvent(supabase, {
    householdId: input.householdId,
    jarId: null,
    eventType: "allocation.review_created",
    sourceType: "income_transaction",
    sourceId: input.transactionId,
    idempotencyKey: `income_transaction:${input.transactionId}:review_created`,
    actorUserId: input.userId,
    payload: { suggestionCount: suggestions.length },
  });

  return { queued: true, reviewId, movements: [], events: [event] };
}

export async function resolveReviewToMovements(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    reviewId: string;
    userId: string;
    allocations: Array<{ jarId: string; amount: number }>;
  },
): Promise<AllocationResult> {
  const reviewResult = await supabase
    .from("jar_review_queue")
    .select("*")
    .eq("household_id", input.householdId)
    .eq("id", input.reviewId)
    .maybeSingle();

  if (reviewResult.error || !reviewResult.data) {
    throw new Error(reviewResult.error?.message ?? "Review item not found.");
  }

  const review = reviewResult.data as Record<string, unknown>;
  const sourceType = String(review.source_type);
  const sourceId = String(review.source_id);
  const movementDate = String(review.movement_date);
  const context =
    review.context_json && typeof review.context_json === "object"
      ? (review.context_json as Record<string, unknown>)
      : {};

  const normalizedAllocations = input.allocations
    .map((row) => ({
      jarId: row.jarId,
      amount: Math.round(Number(row.amount ?? 0)),
    }))
    .filter((row) => row.jarId && row.amount > 0);

  if (normalizedAllocations.length === 0) {
    throw new Error("At least one jar allocation is required.");
  }

  const movements: Array<{ id: string; idempotencyKey: string }> = [];
  const events: Array<{ id: string; idempotencyKey: string }> = [];

  for (const [index, allocation] of normalizedAllocations.entries()) {
    let movementCmd: CreateMovementCommand;

    if (sourceType === "income_transaction") {
      movementCmd = {
        householdId: input.householdId,
        jarId: allocation.jarId,
        movementDate,
        amount: allocation.amount,
        balanceDelta: 1,
        locationFrom: "external",
        locationTo: "cash",
        sourceType: "income_transaction",
        sourceId,
        sourceLineKey: `alloc-${index}`,
        movementType: "allocation_income",
        idempotencyKey: `income_transaction:${sourceId}:alloc-${index}`,
        relatedTransactionId: sourceId,
        note: String(context.description ?? "Income allocation"),
        createdBy: input.userId,
        reviewQueueId: input.reviewId,
      };
    } else if (sourceType === "expense_transaction") {
      movementCmd = {
        householdId: input.householdId,
        jarId: allocation.jarId,
        movementDate,
        amount: allocation.amount,
        balanceDelta: -1,
        locationFrom: "cash",
        locationTo: "expense",
        sourceType: "expense_transaction",
        sourceId,
        sourceLineKey: `alloc-${index}`,
        movementType: "expense_spend",
        idempotencyKey: `expense_transaction:${sourceId}:alloc-${index}`,
        relatedTransactionId: sourceId,
        note: String(context.description ?? "Expense allocation"),
        createdBy: input.userId,
        reviewQueueId: input.reviewId,
      };
    } else if (sourceType === "savings_create") {
      movementCmd = {
        householdId: input.householdId,
        jarId: allocation.jarId,
        movementDate,
        amount: allocation.amount,
        balanceDelta: 0,
        locationFrom: "cash",
        locationTo: "savings",
        sourceType: "savings_create",
        sourceId,
        sourceLineKey: `alloc-${index}`,
        movementType: "allocation_manual",
        idempotencyKey: `savings_create:${sourceId}:alloc-${index}`,
        relatedSavingsId: String(context.savingsId ?? sourceId),
        note: String(context.providerName ?? "Savings create"),
        createdBy: input.userId,
        reviewQueueId: input.reviewId,
      };
    } else if (
      sourceType === "savings_withdraw" ||
      sourceType === "savings_mature"
    ) {
      const principalAmount = Math.round(
        Number(context.principalAmount ?? allocation.amount),
      );
      const interestAmount = Math.round(Number(context.interestAmount ?? 0));
      const taxAmount = Math.round(Number(context.taxAmount ?? 0));

      const principalCmd: CreateMovementCommand = {
        householdId: input.householdId,
        jarId: allocation.jarId,
        movementDate,
        amount: principalAmount,
        balanceDelta: 0,
        locationFrom: "savings",
        locationTo: "cash",
        sourceType: sourceType as "savings_withdraw" | "savings_mature",
        sourceId,
        sourceLineKey: `principal-${index}`,
        movementType: "allocation_manual",
        idempotencyKey: `${sourceType}:${sourceId}:principal-${index}`,
        relatedSavingsId: String(context.savingsId ?? sourceId),
        note: String(context.providerName ?? "Savings release"),
        createdBy: input.userId,
        reviewQueueId: input.reviewId,
      };

      const validation = await validateMovementCommand(supabase, principalCmd);
      if (validation.ok) {
        const movementId = await createJarMovement(supabase, principalCmd);
        movements.push({ id: movementId, idempotencyKey: principalCmd.idempotencyKey });
      }

      if (interestAmount > 0) {
        const interestCmd: CreateMovementCommand = {
          householdId: input.householdId,
          jarId: allocation.jarId,
          movementDate,
          amount: interestAmount,
          balanceDelta: 1,
          locationFrom: "external",
          locationTo: "cash",
          sourceType: sourceType as "savings_withdraw" | "savings_mature",
          sourceId,
          sourceLineKey: `interest-${index}`,
          movementType: "allocation_income",
          idempotencyKey: `${sourceType}:${sourceId}:interest-${index}`,
          relatedSavingsId: String(context.savingsId ?? sourceId),
          note: `Savings interest ${String(context.providerName ?? "")}`.trim(),
          createdBy: input.userId,
          reviewQueueId: input.reviewId,
        };

        const interestValidation = await validateMovementCommand(supabase, interestCmd);
        if (interestValidation.ok) {
          const movementId = await createJarMovement(supabase, interestCmd);
          movements.push({ id: movementId, idempotencyKey: interestCmd.idempotencyKey });
        }
      }

      if (taxAmount > 0) {
        const taxCmd: CreateMovementCommand = {
          householdId: input.householdId,
          jarId: allocation.jarId,
          movementDate,
          amount: taxAmount,
          balanceDelta: -1,
          locationFrom: "cash",
          locationTo: "external",
          sourceType: sourceType as "savings_withdraw" | "savings_mature",
          sourceId,
          sourceLineKey: `tax-${index}`,
          movementType: "expense_spend",
          idempotencyKey: `${sourceType}:${sourceId}:tax-${index}`,
          relatedSavingsId: String(context.savingsId ?? sourceId),
          note: `Savings tax ${String(context.providerName ?? "")}`.trim(),
          createdBy: input.userId,
          reviewQueueId: input.reviewId,
        };

        const taxValidation = await validateMovementCommand(supabase, taxCmd);
        if (taxValidation.ok) {
          const movementId = await createJarMovement(supabase, taxCmd);
          movements.push({ id: movementId, idempotencyKey: taxCmd.idempotencyKey });
        }
      }

      const event = await createJarEvent(supabase, {
        householdId: input.householdId,
        jarId: allocation.jarId,
        eventType: "allocation.manual_resolved",
        sourceType,
        sourceId,
        idempotencyKey: `${sourceType}:${sourceId}:manual_resolved`,
        actorUserId: input.userId,
        payload: { allocations: normalizedAllocations },
      });
      events.push(event);

      const update = await supabase
        .from("jar_review_queue")
        .update({
          status: "resolved",
          resolved_allocations: normalizedAllocations,
          resolved_by: input.userId,
          resolved_at: new Date().toISOString(),
        })
        .eq("household_id", input.householdId)
        .eq("id", input.reviewId);

      if (update.error) throw new Error(update.error.message);

      return { queued: false, movements, events };
    } else {
      continue;
    }

    const validation = await validateMovementCommand(supabase, movementCmd);
    if (!validation.ok) continue;

    const movementId = await createJarMovement(supabase, movementCmd);
    movements.push({ id: movementId, idempotencyKey: movementCmd.idempotencyKey });
  }

  const event = await createJarEvent(supabase, {
    householdId: input.householdId,
    jarId: null,
    eventType: "allocation.manual_resolved",
    sourceType,
    sourceId,
    idempotencyKey: `${sourceType}:${sourceId}:manual_resolved`,
    actorUserId: input.userId,
    payload: { allocations: normalizedAllocations },
  });
  events.push(event);

  const update = await supabase
    .from("jar_review_queue")
    .update({
      status: "resolved",
      resolved_allocations: normalizedAllocations,
      resolved_by: input.userId,
      resolved_at: new Date().toISOString(),
    })
    .eq("household_id", input.householdId)
    .eq("id", input.reviewId);

  if (update.error) throw new Error(update.error.message);

  return { queued: false, movements, events };
}
