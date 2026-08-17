import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  AccountType,
  CREDIT_CARD_INSTALLMENT_CALCULATION_SOURCE_VALUES,
  CREDIT_CARD_INSTALLMENT_FEE_TIMING_VALUES,
  CREDIT_CARD_INSTALLMENT_FEE_TYPE_VALUES,
  CREDIT_CARD_INSTALLMENT_ORIGIN_VALUES,
  CREDIT_CARD_INSTALLMENT_PROGRAM_VALUES,
  CreditCardInstallmentCalculationSource,
  CreditCardInstallmentFeeType,
  CreditCardInstallmentProgram,
  CreditCardInstallmentStatus,
} from "../ledger-constants";
import {
  buildCreditCardInstallmentPreview,
  type CreditCardInstallmentPreview,
} from "../credit-card-installments";
import type { Result } from "@/modules/shared-kernel/application/result";
import {
  classifyInstallmentRpcError,
  LEDGER_OPERATION,
  logLedgerFailure,
} from "../ledger-error";

const wholeVnd = z.number().finite().int().nonnegative();
const positiveVnd = z.number().finite().int().positive();
const basisPoints = z.number().finite().int().min(0).max(100_000);

export const registerCreditCardInstallmentInputSchema = z
  .object({
    cardAccountId: z.string().uuid(),
    sourceTransactionId: z.string().uuid(),
    origin: z.enum(CREDIT_CARD_INSTALLMENT_ORIGIN_VALUES),
    termCount: z.number().int().min(1).max(120),
    firstExpectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    program: z.enum(CREDIT_CARD_INSTALLMENT_PROGRAM_VALUES),
    calculationSource: z.enum(
      CREDIT_CARD_INSTALLMENT_CALCULATION_SOURCE_VALUES,
    ),
    conversionFeeType: z.enum(CREDIT_CARD_INSTALLMENT_FEE_TYPE_VALUES),
    conversionFeeFixedAmount: wholeVnd.optional(),
    conversionFeeRateBps: basisPoints.optional(),
    feeTiming: z.enum(CREDIT_CARD_INSTALLMENT_FEE_TIMING_VALUES),
    flatInterestRateBps: basisPoints.optional(),
    quotedTotalRepayment: positiveVnd.optional(),
    note: z.string().trim().max(500).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const needsFee =
      value.program ===
        CreditCardInstallmentProgram.ZERO_INTEREST_WITH_CONVERSION_FEE ||
      value.program ===
        CreditCardInstallmentProgram.FLAT_INTEREST_WITH_CONVERSION_FEE;
    const needsInterest =
      value.program ===
        CreditCardInstallmentProgram.FLAT_INTEREST_WITHOUT_CONVERSION_FEE ||
      value.program ===
        CreditCardInstallmentProgram.FLAT_INTEREST_WITH_CONVERSION_FEE;
    if (
      needsFee &&
      value.conversionFeeType === CreditCardInstallmentFeeType.NONE
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["conversionFeeType"],
        message: "conversion_fee_required",
      });
    }
    if (
      value.conversionFeeType === CreditCardInstallmentFeeType.FIXED &&
      !value.conversionFeeFixedAmount
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["conversionFeeFixedAmount"],
        message: "fixed_conversion_fee_required",
      });
    }
    if (
      value.conversionFeeType === CreditCardInstallmentFeeType.PERCENTAGE &&
      !value.conversionFeeRateBps
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["conversionFeeRateBps"],
        message: "percentage_conversion_fee_required",
      });
    }
    if (
      needsInterest &&
      value.calculationSource ===
        CreditCardInstallmentCalculationSource.DERIVED &&
      !value.flatInterestRateBps
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["flatInterestRateBps"],
        message: "flat_interest_rate_required",
      });
    }
    if (
      value.calculationSource ===
        CreditCardInstallmentCalculationSource.BANK_QUOTED &&
      !value.quotedTotalRepayment
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quotedTotalRepayment"],
        message: "quoted_repayment_required",
      });
    }
  });

export type RegisterCreditCardInstallmentInput = z.infer<
  typeof registerCreditCardInstallmentInputSchema
>;
export type RegisterCreditCardInstallmentResult = Result<
  { installmentId: string; preview: CreditCardInstallmentPreview },
  ProductActionErrorCode
>;

/** Creates local schedule metadata only; the existing billing ledger owns debt. */
export async function registerCreditCardInstallment(
  raw: RegisterCreditCardInstallmentInput,
): Promise<RegisterCreditCardInstallmentResult> {
  const parsed = registerCreditCardInstallmentInputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok)
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };

  try {
    const supabase = await createSupabaseServerClient();
    const [
      { data: card, error: cardError },
      { data: source, error: sourceError },
      { data: existing, error: existingError },
    ] = await Promise.all([
      supabase
        .from("accounts")
        .select("id, type, is_archived")
        .eq("id", parsed.data.cardAccountId)
        .eq("household_id", gate.householdId)
        .maybeSingle(),
      supabase
        .from("transactions")
        .select(
          "id, account_id, type, amount, note, reverses_transaction_id, corrects_transaction_id",
        )
        .eq("id", parsed.data.sourceTransactionId)
        .eq("household_id", gate.householdId)
        .maybeSingle(),
      supabase
        .from("credit_card_installments")
        .select("id")
        .eq("household_id", gate.householdId)
        .eq("source_transaction_id", parsed.data.sourceTransactionId)
        .maybeSingle(),
    ]);
    if (cardError || sourceError || existingError) {
      logLedgerFailure(
        cardError ?? sourceError ?? existingError,
        LEDGER_OPERATION.REGISTER_CREDIT_CARD_INSTALLMENT,
        {
          householdId: gate.householdId,
          cardAccountId: parsed.data.cardAccountId,
          sourceTransactionId: parsed.data.sourceTransactionId,
        },
      );
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    if (
      !card ||
      card.is_archived ||
      card.type !== AccountType.CREDIT_CARD ||
      !source ||
      source.account_id !== parsed.data.cardAccountId ||
      source.type !== "expense" ||
      Number(source.amount) <= 0 ||
      source.reverses_transaction_id ||
      source.corrects_transaction_id ||
      existing
    )
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };

    const preview = buildCreditCardInstallmentPreview({
      principal: Number(source.amount),
      termCount: parsed.data.termCount,
      firstExpectedDate: parsed.data.firstExpectedDate,
      program: parsed.data.program,
      calculationSource: parsed.data.calculationSource,
      conversionFeeType: parsed.data.conversionFeeType,
      conversionFeeFixedAmount: parsed.data.conversionFeeFixedAmount,
      conversionFeeRateBps: parsed.data.conversionFeeRateBps,
      feeTiming: parsed.data.feeTiming,
      flatInterestRateBps: parsed.data.flatInterestRateBps,
      quotedTotalRepayment: parsed.data.quotedTotalRepayment,
    });
    if (
      !preview ||
      (parsed.data.calculationSource ===
        CreditCardInstallmentCalculationSource.BANK_QUOTED &&
        parsed.data.quotedTotalRepayment !== preview.totalRepayment)
    ) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const { data: installment, error: installmentError } = await supabase
      .from("credit_card_installments")
      .insert({
        household_id: gate.householdId,
        card_account_id: parsed.data.cardAccountId,
        source_transaction_id: parsed.data.sourceTransactionId,
        origin: parsed.data.origin,
        description: source.note?.trim() || null,
        principal: preview.principal,
        term_count: parsed.data.termCount,
        first_expected_date: parsed.data.firstExpectedDate,
        program: parsed.data.program,
        calculation_source: parsed.data.calculationSource,
        conversion_fee_type: parsed.data.conversionFeeType,
        conversion_fee_rate_bps: parsed.data.conversionFeeRateBps ?? null,
        conversion_fee_amount: preview.conversionFeeAmount,
        fee_timing: parsed.data.feeTiming,
        flat_interest_rate_bps: parsed.data.flatInterestRateBps ?? null,
        total_interest_amount: preview.interestAmount,
        quoted_total_repayment: parsed.data.quotedTotalRepayment ?? null,
        status: CreditCardInstallmentStatus.ACTIVE,
        note: parsed.data.note || null,
        created_by: gate.userId,
      })
      .select("id")
      .single();
    if (installmentError) {
      const code = classifyInstallmentRpcError(installmentError);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logLedgerFailure(
          installmentError,
          LEDGER_OPERATION.REGISTER_CREDIT_CARD_INSTALLMENT,
          {
            householdId: gate.householdId,
            cardAccountId: parsed.data.cardAccountId,
            sourceTransactionId: parsed.data.sourceTransactionId,
          },
        );
      }
      return { ok: false, code };
    }
    if (!installment?.id) {
      logLedgerFailure(
        null,
        LEDGER_OPERATION.REGISTER_CREDIT_CARD_INSTALLMENT,
        {
          householdId: gate.householdId,
          cardAccountId: parsed.data.cardAccountId,
          sourceTransactionId: parsed.data.sourceTransactionId,
          responseInvalid: true,
        },
      );
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const { error: scheduleError } = await supabase
      .from("credit_card_installment_schedule")
      .insert(
        preview.schedule.map((entry) => ({
          household_id: gate.householdId,
          installment_id: installment.id,
          installment_number: entry.installmentNumber,
          expected_date: entry.expectedDate,
          principal_amount: entry.principalAmount,
          conversion_fee_amount: entry.conversionFeeAmount,
          interest_amount: entry.interestAmount,
          total_amount: entry.totalAmount,
          status: entry.status,
        })),
      );
    if (scheduleError) {
      logLedgerFailure(
        scheduleError,
        LEDGER_OPERATION.REGISTER_CREDIT_CARD_INSTALLMENT,
        {
          householdId: gate.householdId,
          cardAccountId: parsed.data.cardAccountId,
          installmentId: installment.id,
        },
      );
      const { error: cleanupError } = await supabase
        .from("credit_card_installments")
        .delete()
        .eq("id", installment.id)
        .eq("household_id", gate.householdId);
      if (cleanupError) {
        logLedgerFailure(
          cleanupError,
          LEDGER_OPERATION.REGISTER_CREDIT_CARD_INSTALLMENT,
          {
            householdId: gate.householdId,
            cardAccountId: parsed.data.cardAccountId,
            installmentId: installment.id,
          },
        );
      }
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, installmentId: installment.id, preview };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.REGISTER_CREDIT_CARD_INSTALLMENT, {
      householdId: gate.householdId,
      cardAccountId: parsed.data.cardAccountId,
      sourceTransactionId: parsed.data.sourceTransactionId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
