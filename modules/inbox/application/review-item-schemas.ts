import { z } from "zod";
import {
  ReviewItemType,
  REVIEW_ITEM_TYPE_VALUES,
  InboxItemKind,
} from "./inbox-constants";
import {
  RenewalPolicy,
  SettlementRule,
  PenaltyStrategy,
  RENEWAL_SUGGESTED_ACTION_VALUES,
  MATURITY_WARNING_CODE_VALUES,
} from "@/modules/savings/application/savings-constants";

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
  cascadeDay: z
    .union([
      z.literal(30),
      z.literal(14),
      z.literal(7),
      z.literal(3),
      z.literal(1),
    ])
    .optional(),
});

/** Rich savings maturity decision payload with renewal policy engine fields. */
export const savingsMaturityDecisionPayloadSchema = z.object({
  savingId: z.string().uuid(),
  cycleId: z.string().uuid(),
  providerName: z.string(),
  currentPackage: z.string(),
  currentRate: z.number(),
  previousRate: z.number().nullable(),
  rateDifference: z.number(),
  recommendedPackages: z.array(
    z.object({
      packageId: z.string().uuid(),
      packageName: z.string(),
      durationDays: z.number(),
      annualRate: z.number(),
      rateDifference: z.number().optional(),
      durationDeltaDays: z.number().optional(),
      reasonCode: z.string().optional(),
    }),
  ),
  estimatedInterest: z.number(),
  configuredRenewalPreference: z.string(),
  renewalPolicy: z.string().optional(),
  renewalConfig: z
    .object({
      preferredPackageId: z.string().uuid().nullable().optional(),
      preferredSettlementRule: z.string().optional(),
      preferredSettlementAccountId: z.string().uuid().nullable().optional(),
    })
    .optional(),
  settlementRule: z.string(),
  principal: z.number(),
  accruedInterest: z.number(),
  maturityDate: z.string(),
  suggestedAction: z.enum(RENEWAL_SUGGESTED_ACTION_VALUES).optional(),
  renewalConfidence: z.number().min(0).max(1).optional(),
  warnings: z
    .array(
      z.object({
        code: z.enum(MATURITY_WARNING_CODE_VALUES),
      }),
    )
    .optional(),
  preselectedPackageId: z.string().uuid().nullable().optional(),
  preselectedSettlementRule: z.string().optional(),
  preselectedSettlementAccountId: z.string().uuid().nullable().optional(),
  recommendationReason: z.string().nullable().optional(),
});

export const earlyWithdrawalConfirmationPayloadSchema = z.object({
  savingId: z.string().uuid(),
  cycleId: z.string().uuid(),
  principal: z.number(),
  accruedInterest: z.number(),
  eligibleInterest: z.number(),
  penaltyAmount: z.number(),
  netReturned: z.number(),
  penaltyStrategy: z.string(),
  daysHeld: z.number(),
  totalTermDays: z.number(),
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
  [ReviewItemType.SAVINGS_MATURITY_DECISION]: savingsMaturityDecisionPayloadSchema,
  [ReviewItemType.EARLY_WITHDRAWAL_CONFIRMATION]: earlyWithdrawalConfirmationPayloadSchema,
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
    type: z.literal(ReviewItemType.SAVINGS_MATURITY_DECISION),
    payload: savingsMaturityDecisionPayloadSchema,
  }),
  z.object({
    type: z.literal(ReviewItemType.EARLY_WITHDRAWAL_CONFIRMATION),
    payload: earlyWithdrawalConfirmationPayloadSchema,
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
  cascadeDay?: 30 | 14 | 7 | 3 | 1;
  planMovementId?: string;
  sourceJarId?: string;
  targetJarId?: string;
  executedByUserId?: string | null;
  contextJson?: Record<string, unknown> | null;
}): TypedReviewItem | null {
  const ctx = input.contextJson ?? {};

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
    case InboxItemKind.SAVINGS_MATURED:
    case InboxItemKind.RENEWAL_REQUIRED: {
      type RecommendedPackage = {
        packageId: string;
        packageName: string;
        durationDays: number;
        annualRate: number;
        rateDifference?: number;
        durationDeltaDays?: number;
        reasonCode?: string;
      };

      const recommendedRaw = ctx.recommendedPackages;
      const recommendedPackages: RecommendedPackage[] = Array.isArray(
        recommendedRaw,
      )
        ? recommendedRaw.flatMap((item): RecommendedPackage[] => {
            if (!item || typeof item !== "object") return [];
            const row = item as Record<string, unknown>;
            if (typeof row.packageId !== "string") return [];
            return [
              {
                packageId: row.packageId,
                packageName: String(row.packageName ?? ""),
                durationDays: Number(row.durationDays ?? 0),
                annualRate: Number(row.annualRate ?? 0),
                ...(row.rateDifference == null
                  ? {}
                  : { rateDifference: Number(row.rateDifference) }),
                ...(row.durationDeltaDays == null
                  ? {}
                  : { durationDeltaDays: Number(row.durationDeltaDays) }),
                ...(typeof row.reasonCode === "string"
                  ? { reasonCode: row.reasonCode }
                  : {}),
              },
            ];
          })
        : [];

      const warningsRaw = ctx.warnings;
      const warnings = Array.isArray(warningsRaw)
        ? warningsRaw.flatMap(
            (
              item,
            ): { code: (typeof MATURITY_WARNING_CODE_VALUES)[number] }[] => {
              if (!item || typeof item !== "object") return [];
              const row = item as Record<string, unknown>;
              if (
                typeof row.code !== "string" ||
                !(MATURITY_WARNING_CODE_VALUES as readonly string[]).includes(
                  row.code,
                )
              ) {
                return [];
              }
              return [
                {
                  code: row.code as (typeof MATURITY_WARNING_CODE_VALUES)[number],
                },
              ];
            },
          )
        : undefined;

      const renewalPolicy = String(
        ctx.renewalPolicy ??
          ctx.configuredRenewalPreference ??
          RenewalPolicy.ALWAYS_ASK,
      );

      const renewalConfigRaw =
        ctx.renewalConfig && typeof ctx.renewalConfig === "object"
          ? (ctx.renewalConfig as Record<string, unknown>)
          : null;

      const payload = {
        savingId: String(ctx.savingId ?? input.sourceId),
        cycleId: String(ctx.cycleId ?? input.sourceId),
        providerName: String(ctx.providerName ?? ""),
        currentPackage: String(ctx.currentPackage ?? ""),
        currentRate: Number(ctx.currentRate ?? 0),
        previousRate:
          ctx.previousRate == null ? null : Number(ctx.previousRate),
        rateDifference: Number(ctx.rateDifference ?? 0),
        recommendedPackages,
        estimatedInterest: Number(
          ctx.estimatedInterest ?? ctx.accruedInterest ?? 0,
        ),
        configuredRenewalPreference: renewalPolicy,
        renewalPolicy,
        renewalConfig: renewalConfigRaw
          ? {
              preferredPackageId:
                typeof renewalConfigRaw.preferredPackageId === "string"
                  ? renewalConfigRaw.preferredPackageId
                  : null,
              preferredSettlementRule:
                typeof renewalConfigRaw.preferredSettlementRule === "string"
                  ? renewalConfigRaw.preferredSettlementRule
                  : undefined,
              preferredSettlementAccountId:
                typeof renewalConfigRaw.preferredSettlementAccountId ===
                "string"
                  ? renewalConfigRaw.preferredSettlementAccountId
                  : null,
            }
          : undefined,
        settlementRule: String(
          ctx.settlementRule ??
            ctx.preselectedSettlementRule ??
            SettlementRule.WITHDRAW_EVERYTHING,
        ),
        principal: Number(ctx.principal ?? 0),
        accruedInterest: Number(ctx.accruedInterest ?? 0),
        maturityDate: String(ctx.maturityDate ?? ""),
        suggestedAction:
          typeof ctx.suggestedAction === "string" &&
          (RENEWAL_SUGGESTED_ACTION_VALUES as readonly string[]).includes(
            ctx.suggestedAction,
          )
            ? (ctx.suggestedAction as (typeof RENEWAL_SUGGESTED_ACTION_VALUES)[number])
            : undefined,
        renewalConfidence:
          ctx.renewalConfidence == null
            ? undefined
            : Number(ctx.renewalConfidence),
        warnings,
        preselectedPackageId:
          typeof ctx.preselectedPackageId === "string"
            ? ctx.preselectedPackageId
            : ctx.preselectedPackageId === null
              ? null
              : undefined,
        preselectedSettlementRule:
          typeof ctx.preselectedSettlementRule === "string"
            ? ctx.preselectedSettlementRule
            : undefined,
        preselectedSettlementAccountId:
          typeof ctx.preselectedSettlementAccountId === "string"
            ? ctx.preselectedSettlementAccountId
            : ctx.preselectedSettlementAccountId === null
              ? null
              : undefined,
        recommendationReason:
          typeof ctx.recommendationReason === "string"
            ? ctx.recommendationReason
            : ctx.recommendationReason === null
              ? null
              : undefined,
      };

      const parsed = parseTypedReviewItem({
        type: ReviewItemType.SAVINGS_MATURITY_DECISION,
        payload,
      });
      return parsed.ok
        ? { type: ReviewItemType.SAVINGS_MATURITY_DECISION, payload }
        : {
            type: ReviewItemType.SAVINGS_MATURITY_DECISION,
            payload,
          };
    }
    case InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION: {
      const payload = {
        savingId: String(ctx.savingId ?? input.sourceId),
        cycleId: String(ctx.cycleId ?? input.sourceId),
        principal: Number(ctx.principal ?? 0),
        accruedInterest: Number(ctx.accruedInterest ?? 0),
        eligibleInterest: Number(ctx.eligibleInterest ?? 0),
        penaltyAmount: Number(ctx.penaltyAmount ?? 0),
        netReturned: Number(ctx.netReturned ?? 0),
        penaltyStrategy: String(
          ctx.penaltyStrategy ?? PenaltyStrategy.NO_INTEREST,
        ),
        daysHeld: Number(ctx.daysHeld ?? 0),
        totalTermDays: Number(ctx.totalTermDays ?? 0),
      };
      return {
        type: ReviewItemType.EARLY_WITHDRAWAL_CONFIRMATION,
        payload,
      };
    }
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
