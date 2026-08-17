import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
} from "@/modules/tenancy/application/product-action-error";
import {
  DEFAULT_CURRENCY,
  ISO_DATE_PATTERN,
  LedgerRelation,
  LedgerRpcName,
  LoanInterestRatePeriodKind,
  LoanInterestStrategy,
  LoanPaymentMode,
  LoanScheduleEntryStatus,
  LoanStatus,
  LOAN_INTEREST_STRATEGY_VALUES,
  LOAN_PAYMENT_EXECUTABLE_MODE_VALUES,
  LOAN_REPAYMENT_METHOD_VALUES,
  RECORD_LOAN_PAYMENT_INVALID_ERROR_NEEDLES,
} from "../ledger-constants";
import {
  addMonthsYmd,
  buildAmortizationSchedule,
  buildRateSegmentsFromStrategy,
  normalizeTermToMonths,
  recomputeUpcomingSchedule,
} from "../loan-amortization";
import {
  createLoanInputSchema,
  type CreateLoanInput,
} from "./money-products.schema";
import type { MoneyProductMutationResult } from "./shared";

function initialRatePeriodsJson(input: {
  interestStrategy: (typeof LOAN_INTEREST_STRATEGY_VALUES)[number];
  firstPaymentDate: string;
  annualInterestRate: number;
  promoFixedRate?: number | null;
  promoFixedMonths?: number | null;
  promoFloatingRate?: number | null;
  promoRateEffectiveOn?: string | null;
}): Array<{
  sequence: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  annualRate: number;
  kind: LoanInterestRatePeriodKind;
}> {
  if (input.interestStrategy === LoanInterestStrategy.PROMO_FIXED_TO_FLOATING) {
    const months = Math.max(1, Math.trunc(input.promoFixedMonths ?? 1));
    const switchDate =
      input.promoRateEffectiveOn &&
      input.promoRateEffectiveOn >= input.firstPaymentDate
        ? input.promoRateEffectiveOn
        : addMonthsYmd(input.firstPaymentDate, months);
    return [
      {
        sequence: 1,
        effectiveFrom: input.firstPaymentDate,
        effectiveTo: switchDate,
        annualRate: input.promoFixedRate ?? 0,
        kind: LoanInterestRatePeriodKind.PROMOTIONAL,
      },
      {
        sequence: 2,
        effectiveFrom: switchDate,
        effectiveTo: null,
        annualRate: input.promoFloatingRate ?? 0,
        kind: LoanInterestRatePeriodKind.FLOATING,
      },
    ];
  }
  const kind =
    input.interestStrategy === LoanInterestStrategy.FLOATING
      ? LoanInterestRatePeriodKind.FLOATING
      : LoanInterestRatePeriodKind.FIXED;
  return [
    {
      sequence: 1,
      effectiveFrom: input.firstPaymentDate,
      effectiveTo: null,
      annualRate: input.annualInterestRate,
      kind,
    },
  ];
}

export async function createLoan(
  raw: CreateLoanInput,
): Promise<MoneyProductMutationResult> {
  const parsed = createLoanInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  const termMonths = normalizeTermToMonths(
    parsed.data.termValue,
    parsed.data.termUnit,
  );
  if (termMonths <= 0 || termMonths > 600) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const firstPaymentDate =
    parsed.data.firstPaymentDate ?? parsed.data.startDate;
  const promoEffective =
    parsed.data.interestStrategy ===
    LoanInterestStrategy.PROMO_FIXED_TO_FLOATING
      ? parsed.data.promoRateEffectiveOn &&
        parsed.data.promoRateEffectiveOn >= firstPaymentDate
        ? parsed.data.promoRateEffectiveOn
        : addMonthsYmd(
            firstPaymentDate,
            Math.max(1, Math.trunc(parsed.data.promoFixedMonths ?? 1)),
          )
      : null;

  const currentRate =
    parsed.data.interestStrategy ===
    LoanInterestStrategy.PROMO_FIXED_TO_FLOATING
      ? (parsed.data.promoFixedRate ?? 0)
      : parsed.data.annualInterestRate;

  const rateSegments = buildRateSegmentsFromStrategy({
    interestStrategy: parsed.data.interestStrategy,
    firstPaymentDate,
    annualInterestRate: parsed.data.annualInterestRate,
    promoFixedRate: parsed.data.promoFixedRate,
    promoFixedMonths: parsed.data.promoFixedMonths,
    promoFloatingRate: parsed.data.promoFloatingRate,
    promoRateEffectiveOn: promoEffective,
  });

  const schedule = buildAmortizationSchedule({
    principal: parsed.data.principal,
    termMonths,
    firstPaymentDate,
    repaymentMethod: parsed.data.repaymentMethod,
    rateSegments,
  });

  const ratePeriods = initialRatePeriodsJson({
    interestStrategy: parsed.data.interestStrategy,
    firstPaymentDate,
    annualInterestRate: parsed.data.annualInterestRate,
    promoFixedRate: parsed.data.promoFixedRate,
    promoFixedMonths: parsed.data.promoFixedMonths,
    promoFloatingRate: parsed.data.promoFloatingRate,
    promoRateEffectiveOn: promoEffective,
  });

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc(
      LedgerRpcName.CREATE_LOAN_WITH_SCHEDULE,
      {
        p_name: parsed.data.name,
        p_lender: parsed.data.lender ?? null,
        p_loan_type: parsed.data.loanType,
        p_principal: parsed.data.principal,
        p_annual_interest_rate: currentRate,
        p_repayment_method: parsed.data.repaymentMethod,
        p_interest_strategy: parsed.data.interestStrategy,
        p_promo_fixed_rate:
          parsed.data.interestStrategy ===
          LoanInterestStrategy.PROMO_FIXED_TO_FLOATING
            ? (parsed.data.promoFixedRate ?? null)
            : null,
        p_promo_fixed_months:
          parsed.data.interestStrategy ===
          LoanInterestStrategy.PROMO_FIXED_TO_FLOATING
            ? (parsed.data.promoFixedMonths ?? null)
            : null,
        p_promo_floating_rate:
          parsed.data.interestStrategy ===
          LoanInterestStrategy.PROMO_FIXED_TO_FLOATING
            ? (parsed.data.promoFloatingRate ?? null)
            : null,
        p_promo_rate_effective_on: promoEffective,
        p_term_months: termMonths,
        p_start_date: parsed.data.startDate,
        p_first_payment_date: firstPaymentDate,
        p_monthly_payment: schedule.monthlyPayment,
        p_total_interest: schedule.totalInterest,
        p_total_repayment: schedule.totalRepayment,
        p_expected_end_date: schedule.endDate,
        p_note: parsed.data.note ?? null,
        p_currency: DEFAULT_CURRENCY,
        p_schedule: schedule.entries,
        p_rate_periods: ratePeriods,
      },
    );
    if (error) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    const payload = data as { ok?: boolean; loanId?: string } | null;
    if (!payload?.ok || !payload.loanId) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, id: payload.loanId };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export const recordLoanPaymentInputSchema = z.object({
  loanId: z.string().uuid(),
  accountId: z.string().uuid(),
  mode: z
    .enum(LOAN_PAYMENT_EXECUTABLE_MODE_VALUES)
    .optional()
    .default(LoanPaymentMode.SCHEDULED),
  paidAt: z.string().regex(ISO_DATE_PATTERN).optional(),
});

export type RecordLoanPaymentInput = z.infer<
  typeof recordLoanPaymentInputSchema
>;

export async function recordLoanPayment(
  raw: RecordLoanPaymentInput,
): Promise<MoneyProductMutationResult> {
  const parsed = recordLoanPaymentInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc(
      LedgerRpcName.RECORD_LOAN_PAYMENT,
      {
        p_loan_id: parsed.data.loanId,
        p_account_id: parsed.data.accountId,
        p_mode: parsed.data.mode,
        p_paid_at: parsed.data.paidAt ?? null,
      },
    );
    if (error) {
      const message = error.message?.toLowerCase() ?? "";
      if (
        RECORD_LOAN_PAYMENT_INVALID_ERROR_NEEDLES.some((needle) =>
          message.includes(needle),
        )
      ) {
        return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
      }
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    const payload = data as {
      ok?: boolean;
      completed?: boolean;
      inboxItemId?: string;
      transactionId?: string;
      paymentId?: string;
      sourceDelta?: number;
      amount?: number;
      principalPaid?: number;
      interestPaid?: number;
      feePaid?: number;
      remainingPrincipal?: number;
      scheduleEntryId?: string;
    } | null;
    if (!payload?.ok) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return {
      ok: true,
      id: parsed.data.loanId,
      completed: Boolean(payload.completed),
      inboxItemId: payload.inboxItemId,
      transactionId: payload.transactionId,
      paymentId: payload.paymentId,
      sourceDelta: payload.sourceDelta,
      amount: payload.amount,
      principalPaid: payload.principalPaid,
      interestPaid: payload.interestPaid,
      feePaid: payload.feePaid ?? 0,
      remainingPrincipal: payload.remainingPrincipal,
      scheduleEntryId: payload.scheduleEntryId,
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export const updateLoanMetadataInputSchema = z.object({
  loanId: z.string().uuid(),
  name: z.string().trim().min(1).max(80).optional(),
  lender: z.string().trim().max(80).optional().nullable(),
  note: z.string().trim().max(200).optional().nullable(),
});

export type UpdateLoanMetadataInput = z.infer<
  typeof updateLoanMetadataInputSchema
>;

export async function updateLoanMetadata(
  raw: UpdateLoanMetadataInput,
): Promise<MoneyProductMutationResult> {
  const parsed = updateLoanMetadataInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: payments } = await supabase
      .from(LedgerRelation.LOAN_PAYMENTS)
      .select("id")
      .eq("loan_id", parsed.data.loanId)
      .eq("household_id", gate.householdId)
      .limit(1);
    if ((payments ?? []).length > 0) {
      // Metadata-only still allowed after payments; structural edits are blocked elsewhere.
    }

    const patch: Record<string, string | null> = {};
    if (parsed.data.name != null) patch.name = parsed.data.name;
    if (parsed.data.lender !== undefined) {
      patch.lender = parsed.data.lender;
    }
    if (parsed.data.note !== undefined) patch.note = parsed.data.note;
    if (Object.keys(patch).length === 0) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const { error } = await supabase
      .from(LedgerRelation.LOANS)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", parsed.data.loanId)
      .eq("household_id", gate.householdId)
      .eq("status", LoanStatus.ACTIVE);

    if (error) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, id: parsed.data.loanId };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export const setLoanStatusInputSchema = z.object({
  loanId: z.string().uuid(),
  status: z.enum([
    LoanStatus.CANCELLED,
    LoanStatus.DEFAULTED,
    LoanStatus.ARCHIVED,
  ]),
});

export type SetLoanStatusInput = z.infer<typeof setLoanStatusInputSchema>;

export async function setLoanStatus(
  raw: SetLoanStatusInput,
): Promise<MoneyProductMutationResult> {
  const parsed = setLoanStatusInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc(LedgerRpcName.SET_LOAN_STATUS, {
      p_loan_id: parsed.data.loanId,
      p_status: parsed.data.status,
    });
    if (error) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    const payload = data as { ok?: boolean } | null;
    if (!payload?.ok) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, id: parsed.data.loanId };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export const updateLoanInterestRateInputSchema = z.object({
  loanId: z.string().uuid(),
  annualInterestRate: z.number().finite().min(0).max(100),
  effectiveFrom: z.string().regex(ISO_DATE_PATTERN),
  note: z.string().trim().max(200).optional().nullable(),
});

export type UpdateLoanInterestRateInput = z.infer<
  typeof updateLoanInterestRateInputSchema
>;

export async function updateLoanInterestRate(
  raw: UpdateLoanInterestRateInput,
): Promise<MoneyProductMutationResult> {
  const parsed = updateLoanInterestRateInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: loanRow, error: loanError } = await supabase
      .from(LedgerRelation.LOANS)
      .select(
        "id, remaining_principal, repayment_method, interest_strategy, promo_rate_effective_on, annual_interest_rate, term_months, next_payment_date, first_payment_date, start_date, principal, total_interest",
      )
      .eq("id", parsed.data.loanId)
      .eq("household_id", gate.householdId)
      .maybeSingle();
    if (loanError || !loanRow) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const strategy = loanRow.interest_strategy as string;
    if (strategy === LoanInterestStrategy.FIXED) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.data.effectiveFrom <= today) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    if (
      strategy === LoanInterestStrategy.PROMO_FIXED_TO_FLOATING &&
      loanRow.promo_rate_effective_on &&
      today < loanRow.promo_rate_effective_on
    ) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const { data: periods } = await supabase
      .from(LedgerRelation.LOAN_INTEREST_RATE_PERIODS)
      .select("effective_from, effective_to, annual_rate")
      .eq("loan_id", parsed.data.loanId)
      .eq("household_id", gate.householdId)
      .order("sequence", { ascending: true });

    const { count: paidOnOrAfter } = await supabase
      .from(LedgerRelation.LOAN_SCHEDULE_ENTRIES)
      .select("id", { count: "exact", head: true })
      .eq("loan_id", parsed.data.loanId)
      .eq("household_id", gate.householdId)
      .in("status", [
        LoanScheduleEntryStatus.PAID,
        LoanScheduleEntryStatus.WAIVED,
      ])
      .gte("due_date", parsed.data.effectiveFrom);

    if ((paidOnOrAfter ?? 0) > 0) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const { count: unpaidOnOrAfter } = await supabase
      .from(LedgerRelation.LOAN_SCHEDULE_ENTRIES)
      .select("id", { count: "exact", head: true })
      .eq("loan_id", parsed.data.loanId)
      .eq("household_id", gate.householdId)
      .in("status", [
        LoanScheduleEntryStatus.UPCOMING,
        LoanScheduleEntryStatus.PARTIAL,
      ])
      .gte("due_date", parsed.data.effectiveFrom);

    if ((unpaidOnOrAfter ?? 0) === 0) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const { count: paidCount } = await supabase
      .from(LedgerRelation.LOAN_SCHEDULE_ENTRIES)
      .select("id", { count: "exact", head: true })
      .eq("loan_id", parsed.data.loanId)
      .eq("household_id", gate.householdId)
      .eq("status", LoanScheduleEntryStatus.PAID);

    const { count: upcomingCount } = await supabase
      .from(LedgerRelation.LOAN_SCHEDULE_ENTRIES)
      .select("id", { count: "exact", head: true })
      .eq("loan_id", parsed.data.loanId)
      .eq("household_id", gate.householdId)
      .in("status", [
        LoanScheduleEntryStatus.UPCOMING,
        LoanScheduleEntryStatus.PARTIAL,
      ]);

    const remainingTerm = Math.max(1, upcomingCount ?? 1);
    const sequenceStart = (paidCount ?? 0) + 1;
    const nextDate =
      loanRow.next_payment_date ??
      parsed.data.effectiveFrom ??
      loanRow.first_payment_date ??
      loanRow.start_date;

    const rateSegments = [
      ...(periods ?? [])
        .filter(
          (p) => !p.effective_to || p.effective_to > parsed.data.effectiveFrom,
        )
        .map((p) => ({
          effectiveFrom: p.effective_from as string,
          annualRatePct: Number(p.annual_rate),
        })),
      {
        effectiveFrom: parsed.data.effectiveFrom,
        annualRatePct: parsed.data.annualInterestRate,
      },
    ];

    const rebuilt = recomputeUpcomingSchedule({
      remainingPrincipal: Number(loanRow.remaining_principal),
      remainingTermMonths: remainingTerm,
      nextPaymentDate: nextDate,
      repaymentMethod:
        loanRow.repayment_method as (typeof LOAN_REPAYMENT_METHOD_VALUES)[number],
      rateSegments,
      sequenceStart,
    });

    const { data, error } = await supabase.rpc(
      LedgerRpcName.UPDATE_LOAN_INTEREST_RATE,
      {
        p_loan_id: parsed.data.loanId,
        p_new_annual_rate: parsed.data.annualInterestRate,
        p_effective_from: parsed.data.effectiveFrom,
        p_note: parsed.data.note ?? null,
        p_upcoming_schedule: rebuilt.entries,
        p_monthly_payment: rebuilt.monthlyPayment,
        p_total_interest:
          Number(loanRow.total_interest ?? 0) + rebuilt.totalInterest,
        p_total_repayment:
          Number(loanRow.principal) +
          Number(loanRow.total_interest ?? 0) +
          rebuilt.totalInterest,
        p_expected_end_date: rebuilt.endDate,
        p_next_payment_date: rebuilt.entries[0]?.dueDate ?? nextDate,
      },
    );
    if (error) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    const payload = data as {
      ok?: boolean;
      effectiveFrom?: string;
      newRate?: number;
      futureEntriesBefore?: number;
      futureEntriesAfter?: number;
      historicalUnchanged?: boolean;
    } | null;
    if (!payload?.ok) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return {
      ok: true,
      id: parsed.data.loanId,
      effectiveFrom: payload.effectiveFrom ?? parsed.data.effectiveFrom,
      newRate: payload.newRate ?? parsed.data.annualInterestRate,
      futureEntriesBefore: payload.futureEntriesBefore,
      futureEntriesAfter: payload.futureEntriesAfter,
      historicalUnchanged: payload.historicalUnchanged ?? true,
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
