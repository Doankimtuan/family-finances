import { SupabaseClient } from "@supabase/supabase-js";
import { createJarMovement, upsertJarReviewQueue } from "./core";

export async function syncSavingsCreateToJarIntent(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    userId: string;
    savingsId: string;
    amount: number;
    movementDate: string;
    providerName: string;
    sourceJarId?: string | null;
  },
) {
  if (input.sourceJarId) {
    await createJarMovement(supabase, {
      householdId: input.householdId,
      jarId: input.sourceJarId,
      movementDate: input.movementDate,
      amount: input.amount,
      balanceDelta: 0,
      locationFrom: "cash",
      locationTo: "savings",
      sourceType: "savings_create",
      sourceId: input.savingsId,
      relatedSavingsId: input.savingsId,
      note: `Savings create: ${input.providerName}`,
      createdBy: input.userId,
    });
    return { queued: false };
  }

  await upsertJarReviewQueue(supabase, {
    householdId: input.householdId,
    sourceType: "savings_create",
    sourceId: input.savingsId,
    movementDate: input.movementDate,
    amount: input.amount,
    contextJson: {
      providerName: input.providerName,
      needs: "source_jar",
    },
  });
  return { queued: true };
}

export async function syncSavingsReleaseToJarIntent(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    userId: string;
    sourceType: "savings_withdraw" | "savings_mature";
    sourceId: string;
    savingsId: string;
    movementDate: string;
    providerName: string;
    principalAmount: number;
    interestAmount: number;
    taxAmount: number;
    destinationJarId?: string | null;
  },
) {
  if (input.destinationJarId) {
    await createJarMovement(supabase, {
      householdId: input.householdId,
      jarId: input.destinationJarId,
      movementDate: input.movementDate,
      amount: input.principalAmount,
      balanceDelta: 0,
      locationFrom: "savings",
      locationTo: "cash",
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sourceLineKey: "principal",
      relatedSavingsId: input.savingsId,
      note: `Savings principal release: ${input.providerName}`,
      createdBy: input.userId,
    });
    if (input.interestAmount > 0) {
      await createJarMovement(supabase, {
        householdId: input.householdId,
        jarId: input.destinationJarId,
        movementDate: input.movementDate,
        amount: input.interestAmount,
        balanceDelta: 1,
        locationFrom: "external",
        locationTo: "cash",
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        sourceLineKey: "interest",
        relatedSavingsId: input.savingsId,
        note: `Savings interest ${String(input.providerName ?? "")}`.trim(),
        createdBy: input.userId,
      });
    }
    if (input.taxAmount > 0) {
      await createJarMovement(supabase, {
        householdId: input.householdId,
        jarId: input.destinationJarId,
        movementDate: input.movementDate,
        amount: input.taxAmount,
        balanceDelta: -1,
        locationFrom: "cash",
        locationTo: "external",
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        sourceLineKey: "tax",
        relatedSavingsId: input.savingsId,
        note: `Savings tax ${String(input.providerName ?? "")}`.trim(),
        createdBy: input.userId,
      });
    }
    return { queued: false };
  }

  await upsertJarReviewQueue(supabase, {
    householdId: input.householdId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    movementDate: input.movementDate,
    amount: input.principalAmount + input.interestAmount,
    contextJson: {
      providerName: input.providerName,
      principalAmount: input.principalAmount,
      interestAmount: input.interestAmount,
      taxAmount: input.taxAmount,
      savingsId: input.savingsId,
      needs: "destination_jar",
    },
  });
  return { queued: true };
}
