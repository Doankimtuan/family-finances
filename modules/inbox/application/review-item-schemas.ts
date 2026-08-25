/**
 * Typed Inbox payload + outcome contracts (AC-INB-01 / EVO-02 / Prompt 13A).
 *
 * Every canonical item type owns:
 *  - payload schema (required context),
 *  - allowed acknowledge outcomes,
 *  - terminal statuses,
 *  - defer / expiry / auto-resolution behavior.
 *
 * A legitimate persisted kind that has no typed contract is an explicit
 * unsupported kind and must never surface in the active queue.
 */

import { z } from "zod";
import {
  InboxItemKind,
  InboxItemStatus,
  SavingsMaturityAckAction,
  EarlyWithdrawalAckAction,
  EmiAckAction,
  SAVINGS_MATURITY_ACK_ACTION_VALUES,
  EARLY_WITHDRAWAL_ACK_ACTION_VALUES,
} from "./inbox-constants";
import {
  RenewalPolicy,
  SettlementRule,
  PenaltyStrategy,
  RENEWAL_SUGGESTED_ACTION_VALUES,
  MATURITY_WARNING_CODE_VALUES,
} from "@/modules/savings/application/savings-constants";
import { DebtDueState } from "@/modules/ledger/application/debt-constants";
import { LoanDueState } from "@/modules/ledger/application/loan-constants";

export const unmappedExpensePayloadSchema = z.object({
  transactionId: z.string().uuid(),
  suggestedJarId: z.string().uuid().nullable().optional(),
  suggestedCategoryId: z.string().uuid().nullable().optional(),
  merchantKey: z.string().trim().min(1).nullable().optional(),
  confirmationCount: z.number().int().nonnegative().optional(),
});

export const incomeSuggestPayloadSchema = z.object({
  transactionId: z.string().uuid(),
  suggestedJarId: z.string().uuid().nullable().optional(),
  suggestedCategoryId: z.string().uuid().nullable().optional(),
});

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

export const installmentCompletePayloadSchema = z
  .object({
    installmentPlanId: z.string().uuid().optional(),
    loanId: z.string().uuid().optional(),
    debtId: z.string().uuid().optional(),
  })
  .refine(
    (value) =>
      value.installmentPlanId != null ||
      value.loanId != null ||
      value.debtId != null,
    "InstallmentComplete requires installmentPlanId or debtId",
  );

export const loanPaymentAttentionPayloadSchema = z.object({
  loanId: z.string().uuid(),
  dueState: z.enum([
    LoanDueState.DUE_SOON,
    LoanDueState.DUE_TODAY,
    LoanDueState.OVERDUE,
  ]),
  dueDate: z.string(),
});

export const debtPaymentAttentionPayloadSchema = z.object({
  debtId: z.string().uuid(),
  dueState: z.enum([
    DebtDueState.DUE_SOON,
    DebtDueState.DUE_TODAY,
    DebtDueState.OVERDUE,
  ]),
  dueDate: z.string(),
});

export const emergencyDeclarationPayloadSchema = z.object({
  intentNote: z.string().trim().min(1),
  planMovementId: z.string().uuid().optional(),
  sourceJarId: z.string().uuid().optional(),
  targetJarId: z.string().uuid().optional(),
  executedByUserId: z.string().uuid().optional(),
});

export const reviewItemPayloadByKind = {
  [InboxItemKind.UNMAPPED_EXPENSE]: unmappedExpensePayloadSchema,
  [InboxItemKind.INCOME_SUGGEST]: incomeSuggestPayloadSchema,
  [InboxItemKind.SAVINGS_MATURITY]: savingsMaturityDecisionPayloadSchema,
  [InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION]:
    earlyWithdrawalConfirmationPayloadSchema,
  [InboxItemKind.EMI_COMPLETE]: installmentCompletePayloadSchema,
  [InboxItemKind.LOAN_PAYMENT_ATTENTION]: loanPaymentAttentionPayloadSchema,
  [InboxItemKind.DEBT_PAYMENT_ATTENTION]: debtPaymentAttentionPayloadSchema,
  [InboxItemKind.EMERGENCY_DECLARATION]: emergencyDeclarationPayloadSchema,
} as const satisfies Record<InboxItemKind, z.ZodTypeAny>;

/** Typed payload — one instance per canonical kind. */
export const typedReviewItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(InboxItemKind.UNMAPPED_EXPENSE),
    payload: unmappedExpensePayloadSchema,
  }),
  z.object({
    type: z.literal(InboxItemKind.INCOME_SUGGEST),
    payload: incomeSuggestPayloadSchema,
  }),
  z.object({
    type: z.literal(InboxItemKind.SAVINGS_MATURITY),
    payload: savingsMaturityDecisionPayloadSchema,
  }),
  z.object({
    type: z.literal(InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION),
    payload: earlyWithdrawalConfirmationPayloadSchema,
  }),
  z.object({
    type: z.literal(InboxItemKind.EMI_COMPLETE),
    payload: installmentCompletePayloadSchema,
  }),
  z.object({
    type: z.literal(InboxItemKind.LOAN_PAYMENT_ATTENTION),
    payload: loanPaymentAttentionPayloadSchema,
  }),
  z.object({
    type: z.literal(InboxItemKind.DEBT_PAYMENT_ATTENTION),
    payload: debtPaymentAttentionPayloadSchema,
  }),
  z.object({
    type: z.literal(InboxItemKind.EMERGENCY_DECLARATION),
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

export function isCanonicalInboxKind(value: string): value is InboxItemKind {
  return (Object.values(InboxItemKind) as string[]).includes(value);
}

/** Allowed acknowledge outcomes per canonical kind (empty = not ack-able). */
export const ACK_ACTION_BY_KIND: Readonly<
  Record<InboxItemKind, readonly string[]>
> = {
  [InboxItemKind.UNMAPPED_EXPENSE]: [],
  [InboxItemKind.INCOME_SUGGEST]: [],
  [InboxItemKind.SAVINGS_MATURITY]: SAVINGS_MATURITY_ACK_ACTION_VALUES,
  [InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION]:
    EARLY_WITHDRAWAL_ACK_ACTION_VALUES,
  [InboxItemKind.EMI_COMPLETE]: [EmiAckAction.CELEBRATE, EmiAckAction.LATER],
  [InboxItemKind.LOAN_PAYMENT_ATTENTION]: [],
  [InboxItemKind.DEBT_PAYMENT_ATTENTION]: [],
  [InboxItemKind.EMERGENCY_DECLARATION]: [],
};

/**
 * Outcomes per kind (Prompt 13A contract).
 *
 * - resolve_to_jar: user assigns the source transaction to an Active jar.
 * - dismiss: user intentionally removes the item from active attention.
 * - acknowledge: user records a decision/acknowledgement; Savings owns any
 *   money outcome. `dismiss` is a savings ack action that maps to DISMISSED.
 * - auto_resolve: silent pattern/merchant resolution at high confidence.
 */
export const OUTCOMES_BY_KIND: Readonly<
  Record<InboxItemKind, readonly string[]>
> = {
  [InboxItemKind.UNMAPPED_EXPENSE]: [
    "resolve_to_jar",
    "dismiss",
    "auto_resolve",
  ],
  [InboxItemKind.INCOME_SUGGEST]: ["resolve_to_jar", "dismiss", "auto_resolve"],
  [InboxItemKind.SAVINGS_MATURITY]: [
    ...SAVINGS_MATURITY_ACK_ACTION_VALUES,
    "auto_resolve",
  ],
  [InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION]: [
    ...EARLY_WITHDRAWAL_ACK_ACTION_VALUES,
  ],
  [InboxItemKind.EMI_COMPLETE]: [EmiAckAction.CELEBRATE, EmiAckAction.LATER],
  [InboxItemKind.LOAN_PAYMENT_ATTENTION]: ["dismiss"],
  [InboxItemKind.DEBT_PAYMENT_ATTENTION]: ["dismiss"],
  [InboxItemKind.EMERGENCY_DECLARATION]: ["dismiss"],
} as const;

/** Terminal statuses per kind (Prompt 13A contract). */
export const TERMINAL_STATUSES_BY_KIND: Readonly<
  Record<InboxItemKind, readonly InboxItemStatus[]>
> = {
  [InboxItemKind.UNMAPPED_EXPENSE]: [
    InboxItemStatus.RESOLVED,
    InboxItemStatus.DISMISSED,
    InboxItemStatus.AUTO_RESOLVED,
  ],
  [InboxItemKind.INCOME_SUGGEST]: [
    InboxItemStatus.RESOLVED,
    InboxItemStatus.DISMISSED,
    InboxItemStatus.AUTO_RESOLVED,
  ],
  [InboxItemKind.SAVINGS_MATURITY]: [
    InboxItemStatus.ACKNOWLEDGED,
    InboxItemStatus.DISMISSED,
  ],
  [InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION]: [
    InboxItemStatus.ACKNOWLEDGED,
    InboxItemStatus.DISMISSED,
  ],
  [InboxItemKind.EMI_COMPLETE]: [InboxItemStatus.ACKNOWLEDGED],
  [InboxItemKind.LOAN_PAYMENT_ATTENTION]: [InboxItemStatus.DISMISSED],
  [InboxItemKind.DEBT_PAYMENT_ATTENTION]: [InboxItemStatus.DISMISSED],
  [InboxItemKind.EMERGENCY_DECLARATION]: [InboxItemStatus.DISMISSED],
} as const;

/** Time-bound expiry: only savings maturity currently has an active window. */
export function kindExpiresAt(
  kind: InboxItemKind,
  now = new Date(),
): Date | null {
  return kind === InboxItemKind.SAVINGS_MATURITY
    ? new Date(now.getTime() + KIND_ACTIVE_WINDOW_MS)
    : null;
}

/** Savings maturity stays active for 31 days past the maturity reminder. */
export const KIND_ACTIVE_WINDOW_MS = 31 * 24 * 60 * 60 * 1000;

/**
 * Auto-resolution: only jar-resolvable kinds with a suggested jar and high
 * confidence (BR-16).
 */
export function kindAutoResolvable(kind: InboxItemKind): boolean {
  return [
    InboxItemKind.UNMAPPED_EXPENSE,
    InboxItemKind.INCOME_SUGGEST,
  ].includes(
    kind as unknown as
      | typeof InboxItemKind.UNMAPPED_EXPENSE
      | typeof InboxItemKind.INCOME_SUGGEST,
  );
}

export function kindAckActions(kind: InboxItemKind): readonly string[] {
  return ACK_ACTION_BY_KIND[kind];
}

function asLoanAttentionState(
  value: unknown,
):
  | (
      | typeof LoanDueState.DUE_SOON
      | typeof LoanDueState.DUE_TODAY
      | typeof LoanDueState.OVERDUE
    )
  | null {
  return value === LoanDueState.DUE_SOON ||
    value === LoanDueState.DUE_TODAY ||
    value === LoanDueState.OVERDUE
    ? value
    : null;
}

function asDebtAttentionState(
  value: unknown,
):
  | (
      | typeof DebtDueState.DUE_SOON
      | typeof DebtDueState.DUE_TODAY
      | typeof DebtDueState.OVERDUE
    )
  | null {
  return value === DebtDueState.DUE_SOON ||
    value === DebtDueState.DUE_TODAY ||
    value === DebtDueState.OVERDUE
    ? value
    : null;
}

/** Build a typed instance from kind + loose payload fields. */
export function instantiateTypedReviewItem(input: {
  kind: InboxItemKind;
  sourceId: string;
  intentNote?: string | null;
  suggestedJarId?: string | null;
  suggestedCategoryId?: string | null;
  merchantKey?: string | null;
  confirmationCount?: number;
  planMovementId?: string;
  sourceJarId?: string;
  targetJarId?: string;
  executedByUserId?: string | null;
  contextJson?: Record<string, unknown> | null;
}): TypedReviewItem | null {
  const ctx = input.contextJson ?? {};

  switch (input.kind) {
    case InboxItemKind.UNMAPPED_EXPENSE:
      return {
        type: InboxItemKind.UNMAPPED_EXPENSE,
        payload: {
          transactionId: input.sourceId,
          suggestedJarId: input.suggestedJarId ?? null,
          suggestedCategoryId: input.suggestedCategoryId ?? null,
          merchantKey: input.merchantKey ?? null,
          confirmationCount: input.confirmationCount,
        },
      };
    case InboxItemKind.INCOME_SUGGEST:
      return {
        type: InboxItemKind.INCOME_SUGGEST,
        payload: {
          transactionId: input.sourceId,
          suggestedJarId: input.suggestedJarId ?? null,
          suggestedCategoryId: input.suggestedCategoryId ?? null,
        },
      };
    case InboxItemKind.SAVINGS_MATURITY: {
      const recommendedPackages = Array.isArray(ctx.recommendedPackages)
        ? ctx.recommendedPackages.flatMap(
            (
              item,
            ): {
              packageId: string;
              packageName: string;
              durationDays: number;
              annualRate: number;
              rateDifference?: number;
              durationDeltaDays?: number;
              reasonCode?: string;
            }[] => {
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
            },
          )
        : [];

      const warnings = Array.isArray(ctx.warnings)
        ? ctx.warnings.flatMap(
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

      return {
        type: InboxItemKind.SAVINGS_MATURITY,
        payload: {
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
        },
      };
    }
    case InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION:
      return {
        type: InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION,
        payload: {
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
        },
      };
    case InboxItemKind.EMI_COMPLETE:
      return {
        type: InboxItemKind.EMI_COMPLETE,
        payload: {
          installmentPlanId: input.sourceId,
          loanId: typeof ctx.loanId === "string" ? ctx.loanId : input.sourceId,
          debtId: typeof ctx.debtId === "string" ? ctx.debtId : undefined,
        },
      };
    case InboxItemKind.LOAN_PAYMENT_ATTENTION: {
      const dueState = asLoanAttentionState(ctx.dueState);
      if (!dueState || typeof ctx.dueDate !== "string") return null;
      return {
        type: InboxItemKind.LOAN_PAYMENT_ATTENTION,
        payload: {
          loanId: input.sourceId,
          dueState,
          dueDate: ctx.dueDate,
        },
      };
    }
    case InboxItemKind.DEBT_PAYMENT_ATTENTION: {
      const dueState = asDebtAttentionState(ctx.dueState);
      if (!dueState || typeof ctx.dueDate !== "string") return null;
      return {
        type: InboxItemKind.DEBT_PAYMENT_ATTENTION,
        payload: {
          debtId: input.sourceId,
          dueState,
          dueDate: ctx.dueDate,
        },
      };
    }
    case InboxItemKind.EMERGENCY_DECLARATION: {
      const note = input.intentNote?.trim();
      if (!note) return null;
      return {
        type: InboxItemKind.EMERGENCY_DECLARATION,
        payload: {
          intentNote: note,
          planMovementId: input.planMovementId,
          sourceJarId: input.sourceJarId,
          targetJarId: input.targetJarId,
          executedByUserId: input.executedByUserId ?? undefined,
        },
      };
    }
    default: {
      const unreachable: never = input.kind;
      throw new Error(`Unhandled Inbox kind: ${unreachable}`);
    }
  }
}

export { SavingsMaturityAckAction, EarlyWithdrawalAckAction, EmiAckAction };
