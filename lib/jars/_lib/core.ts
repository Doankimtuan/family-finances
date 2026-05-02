import { SupabaseClient } from "@supabase/supabase-js";
import { JarSuggestion } from "./types";
import { toMonthStart } from "./utils";

export async function upsertJarReviewQueue(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    sourceType: string;
    sourceId: string;
    movementDate: string;
    amount: number;
    suggestedAllocations?: JarSuggestion[];
    contextJson?: Record<string, unknown>;
  },
) {
  const result = await supabase
    .from("jar_review_queue")
    .upsert(
      {
        household_id: input.householdId,
        source_type: input.sourceType,
        source_id: input.sourceId,
        movement_date: input.movementDate,
        month: toMonthStart(input.movementDate),
        amount: Math.round(input.amount),
        suggested_allocations: input.suggestedAllocations ?? [],
        context_json: input.contextJson ?? {},
        status: "pending",
      },
      { onConflict: "household_id,source_type,source_id" },
    )
    .select("id")
    .single();

  if (result.error || !result.data?.id) {
    throw new Error(result.error?.message ?? "Failed to queue jar review.");
  }

  return result.data.id;
}

export async function createJarMovement(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    jarId: string;
    movementDate: string;
    amount: number;
    balanceDelta: -1 | 0 | 1;
    locationFrom?:
      | "external"
      | "cash"
      | "savings"
      | "investment"
      | "asset"
      | "expense"
      | null;
    locationTo?:
      | "external"
      | "cash"
      | "savings"
      | "investment"
      | "asset"
      | "expense"
      | null;
    sourceType:
      | "income_transaction"
      | "expense_transaction"
      | "transfer_transaction"
      | "savings_create"
      | "savings_withdraw"
      | "savings_mature"
      | "asset_buy"
      | "asset_sell"
      | "investment_buy"
      | "investment_sell"
      | "manual_adjustment";
    sourceId: string;
    sourceLineKey?: string;
    relatedTransactionId?: string | null;
    relatedSavingsId?: string | null;
    note?: string | null;
    metadata?: Record<string, unknown>;
    createdBy?: string | null;
    reviewQueueId?: string | null;
  },
) {
  const result = await supabase
    .from("jar_movements")
    .upsert(
      {
        household_id: input.householdId,
        jar_id: input.jarId,
        review_queue_id: input.reviewQueueId ?? null,
        movement_date: input.movementDate,
        month: toMonthStart(input.movementDate),
        amount: Math.round(input.amount),
        balance_delta: input.balanceDelta,
        location_from: input.locationFrom ?? null,
        location_to: input.locationTo ?? null,
        source_type: input.sourceType,
        source_id: input.sourceId,
        source_line_key: input.sourceLineKey ?? "default",
        related_transaction_id: input.relatedTransactionId ?? null,
        related_savings_id: input.relatedSavingsId ?? null,
        note: input.note ?? null,
        metadata: input.metadata ?? {},
        created_by: input.createdBy ?? null,
      },
      {
        onConflict: "household_id,jar_id,source_type,source_id,source_line_key",
      },
    )
    .select("id")
    .single();

  if (result.error || !result.data?.id) {
    throw new Error(result.error?.message ?? "Failed to create jar movement.");
  }

  return result.data.id;
}

export async function resolveJarReviewQueue(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    reviewId: string;
    userId: string;
    allocations: Array<{ jarId: string; amount: number }>;
  },
) {
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

  for (const [index, allocation] of normalizedAllocations.entries()) {
    if (sourceType === "income_transaction") {
      await createJarMovement(supabase, {
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
        relatedTransactionId: sourceId,
        note: String(context.description ?? "Income allocation"),
        createdBy: input.userId,
        reviewQueueId: input.reviewId,
      });
    } else if (sourceType === "expense_transaction") {
      await createJarMovement(supabase, {
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
        relatedTransactionId: sourceId,
        note: String(context.description ?? "Expense allocation"),
        createdBy: input.userId,
        reviewQueueId: input.reviewId,
      });
    } else if (sourceType === "savings_create") {
      await createJarMovement(supabase, {
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
        relatedSavingsId: String(context.savingsId ?? sourceId),
        note: String(context.providerName ?? "Savings create"),
        createdBy: input.userId,
        reviewQueueId: input.reviewId,
      });
    } else if (
      sourceType === "savings_withdraw" ||
      sourceType === "savings_mature"
    ) {
      const principalAmount = Math.round(
        Number(context.principalAmount ?? allocation.amount),
      );
      const interestAmount = Math.round(Number(context.interestAmount ?? 0));
      const taxAmount = Math.round(Number(context.taxAmount ?? 0));
      await createJarMovement(supabase, {
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
        relatedSavingsId: String(context.savingsId ?? sourceId),
        note: String(context.providerName ?? "Savings release"),
        createdBy: input.userId,
        reviewQueueId: input.reviewId,
      });
      if (interestAmount > 0) {
        await createJarMovement(supabase, {
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
          relatedSavingsId: String(context.savingsId ?? sourceId),
          note: `Savings interest ${String(context.providerName ?? "")}`.trim(),
          createdBy: input.userId,
          reviewQueueId: input.reviewId,
        });
      }
      if (taxAmount > 0) {
        await createJarMovement(supabase, {
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
          relatedSavingsId: String(context.savingsId ?? sourceId),
          note: `Savings tax ${String(context.providerName ?? "")}`.trim(),
          createdBy: input.userId,
          reviewQueueId: input.reviewId,
        });
      }
    }
  }

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
}
