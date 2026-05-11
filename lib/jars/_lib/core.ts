import { SupabaseClient } from "@supabase/supabase-js";
import { JarSuggestion } from "./types";
import { toMonthStart } from "./utils";
import { resolveReviewToMovements } from "../domain/allocation-engine";

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
    movementType?: string | null;
    idempotencyKey?: string | null;
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
        movement_type: input.movementType ?? null,
        idempotency_key: input.idempotencyKey ?? null,
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
  await resolveReviewToMovements(supabase, {
    householdId: input.householdId,
    reviewId: input.reviewId,
    userId: input.userId,
    allocations: input.allocations,
  });
}
