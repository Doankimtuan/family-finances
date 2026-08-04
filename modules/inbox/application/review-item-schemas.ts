import { z } from "zod";
import {
  ReviewItemType,
  REVIEW_ITEM_TYPE_VALUES,
  InboxItemKind,
} from "./inbox-constants";

/**
 * Strongly-typed ReviewItem payload schemas (AC-INB-01 / EVO-02).
 */

export const unmappedExpensePayloadSchema = z.object({
  transactionId: z.string().uuid(),
  suggestedJarId: z.string().uuid().nullable().optional(),
  suggestedCategoryId: z.string().uuid().nullable().optional(),
  merchantKey: z.string().trim().min(1).nullable().optional(),
  confirmationCount: z.number().int().nonnegative().optional(),
});

export const maturityDecisionPayloadSchema = z.object({
  savingsId: z.string().uuid(),
  cascadeDay: z.union([z.literal(30), z.literal(14), z.literal(7)]).optional(),
});

export const paymentReminderPayloadSchema = z.object({
  dueAt: z.string().min(1),
  expiresAt: z.string().min(1).nullable().optional(),
  cardId: z.string().uuid().nullable().optional(),
});

export const installmentCompletePayloadSchema = z.object({
  installmentPlanId: z.string().uuid().optional(),
  debtId: z.string().uuid().optional(),
});

export const emergencyDeclarationPayloadSchema = z.object({
  intentNote: z.string().trim().min(1),
  planMovementId: z.string().uuid().optional(),
  sourceJarId: z.string().uuid().optional(),
  targetJarId: z.string().uuid().optional(),
  executedByUserId: z.string().uuid().optional(),
});

export const reviewItemPayloadByType = {
  [ReviewItemType.UNMAPPED_EXPENSE]: unmappedExpensePayloadSchema,
  [ReviewItemType.MATURITY_DECISION]: maturityDecisionPayloadSchema,
  [ReviewItemType.PAYMENT_REMINDER]: paymentReminderPayloadSchema,
  [ReviewItemType.INSTALLMENT_COMPLETE]: installmentCompletePayloadSchema,
  [ReviewItemType.EMERGENCY_DECLARATION]: emergencyDeclarationPayloadSchema,
} as const;

export const typedReviewItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(ReviewItemType.UNMAPPED_EXPENSE),
    payload: unmappedExpensePayloadSchema,
  }),
  z.object({
    type: z.literal(ReviewItemType.MATURITY_DECISION),
    payload: maturityDecisionPayloadSchema,
  }),
  z.object({
    type: z.literal(ReviewItemType.PAYMENT_REMINDER),
    payload: paymentReminderPayloadSchema,
  }),
  z.object({
    type: z.literal(ReviewItemType.INSTALLMENT_COMPLETE),
    payload: installmentCompletePayloadSchema,
  }),
  z.object({
    type: z.literal(ReviewItemType.EMERGENCY_DECLARATION),
    payload: emergencyDeclarationPayloadSchema,
  }),
]);

export type TypedReviewItem = z.infer<typeof typedReviewItemSchema>;

export function parseTypedReviewItem(
  raw: unknown,
): { ok: true; value: TypedReviewItem } | { ok: false; error: z.ZodError } {
  const parsed = typedReviewItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error };
  }
  return { ok: true, value: parsed.data };
}

export function isSpecReviewItemType(
  value: string,
): value is (typeof REVIEW_ITEM_TYPE_VALUES)[number] {
  return (REVIEW_ITEM_TYPE_VALUES as readonly string[]).includes(value);
}

/** Build a typed instance from kind + loose payload fields (AC-INB-01). */
export function instantiateTypedReviewItem(input: {
  kind: InboxItemKind;
  sourceId: string;
  intentNote?: string | null;
  suggestedJarId?: string | null;
  suggestedCategoryId?: string | null;
  dueAt?: string | null;
  expiresAt?: string | null;
  merchantKey?: string | null;
  confirmationCount?: number;
  cascadeDay?: 30 | 14 | 7;
  planMovementId?: string;
  sourceJarId?: string;
  targetJarId?: string;
  executedByUserId?: string | null;
}): TypedReviewItem | null {
  switch (input.kind) {
    case InboxItemKind.UNMAPPED_EXPENSE:
      return parseTypedReviewItem({
        type: ReviewItemType.UNMAPPED_EXPENSE,
        payload: {
          transactionId: input.sourceId,
          suggestedJarId: input.suggestedJarId ?? null,
          suggestedCategoryId: input.suggestedCategoryId ?? null,
          merchantKey: input.merchantKey ?? null,
          confirmationCount: input.confirmationCount,
        },
      }).ok
        ? {
            type: ReviewItemType.UNMAPPED_EXPENSE,
            payload: {
              transactionId: input.sourceId,
              suggestedJarId: input.suggestedJarId ?? null,
              suggestedCategoryId: input.suggestedCategoryId ?? null,
              merchantKey: input.merchantKey ?? null,
              confirmationCount: input.confirmationCount,
            },
          }
        : null;
    case InboxItemKind.SAVINGS_MATURITY:
      return {
        type: ReviewItemType.MATURITY_DECISION,
        payload: {
          savingsId: input.sourceId,
          cascadeDay: input.cascadeDay,
        },
      };
    case InboxItemKind.PAYMENT_REMINDER: {
      if (!input.dueAt) return null;
      return {
        type: ReviewItemType.PAYMENT_REMINDER,
        payload: {
          dueAt: input.dueAt,
          expiresAt: input.expiresAt ?? null,
        },
      };
    }
    case InboxItemKind.EMI_COMPLETE:
      return {
        type: ReviewItemType.INSTALLMENT_COMPLETE,
        payload: {
          installmentPlanId: input.sourceId,
        },
      };
    case InboxItemKind.EMERGENCY_DECLARATION: {
      const note = input.intentNote?.trim();
      if (!note) return null;
      return {
        type: ReviewItemType.EMERGENCY_DECLARATION,
        payload: {
          intentNote: note,
          planMovementId: input.planMovementId,
          sourceJarId: input.sourceJarId,
          targetJarId: input.targetJarId,
          executedByUserId: input.executedByUserId ?? undefined,
        },
      };
    }
    default:
      return null;
  }
}
