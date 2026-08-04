import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  CardBillingItemType,
  DEFAULT_CARD_INSTALLMENT_COUNT,
  DEFAULT_CURRENCY,
  LEDGER_ACTION_ERROR_CODE,
} from "../ledger-constants";
import { InstallmentPlanStatus } from "../money-product-types";
import {
  applyBillingItemConversion,
  canConvertBillingItemOnMonth,
} from "../credit-card-billing";

export const convertToInstallmentInputSchema = z.object({
  billingItemId: z.string().uuid(),
  numInstallments: z
    .number()
    .int()
    .min(2)
    .max(60)
    .default(DEFAULT_CARD_INSTALLMENT_COUNT),
  conversionFee: z.number().int().min(0).optional().default(0),
  name: z.string().trim().min(1).max(80).optional(),
});

export type ConvertToInstallmentInput = z.infer<
  typeof convertToInstallmentInputSchema
>;

export type ConvertToInstallmentResult =
  | { ok: true; planId: string }
  | {
      ok: false;
      code:
        | ProductActionErrorCode
        | typeof LEDGER_ACTION_ERROR_CODE.CONVERT_AFTER_PAYMENT;
    };

/**
 * Convert a standard billing item into an installment plan (legacy EMI convert).
 * monthly = round(original / N); fee charged conceptually on plan total metadata.
 * Blocked after any FIFO payment on the billing month (partial settle).
 */
export async function convertToInstallment(
  raw: ConvertToInstallmentInput,
): Promise<ConvertToInstallmentResult> {
  const parsed = convertToInstallmentInputSchema.safeParse(raw);
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
    const { data: item } = await supabase
      .from("card_billing_items")
      .select(
        "id, household_id, billing_month_id, card_account_id, transaction_id, amount, item_type, is_converted_to_installment, is_paid, description",
      )
      .eq("id", parsed.data.billingItemId)
      .eq("household_id", gate.householdId)
      .maybeSingle();

    if (
      !item ||
      item.is_converted_to_installment ||
      item.is_paid ||
      item.item_type !== CardBillingItemType.STANDARD
    ) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const originalAmount = Math.abs(Number(item.amount));
    if (originalAmount <= 0) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const { data: month } = await supabase
      .from("card_billing_months")
      .select("id, statement_amount, paid_amount, status")
      .eq("id", item.billing_month_id)
      .maybeSingle();

    if (!month) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const monthPaidAmount = Number(month.paid_amount);
    if (
      !canConvertBillingItemOnMonth({
        monthPaidAmount,
        monthStatus: month.status,
        isPaid: item.is_paid,
        isConvertedToInstallment: item.is_converted_to_installment,
        itemType: item.item_type,
        itemAmount: originalAmount,
      })
    ) {
      if (monthPaidAmount > 0) {
        return {
          ok: false,
          code: LEDGER_ACTION_ERROR_CODE.CONVERT_AFTER_PAYMENT,
        };
      }
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const n = parsed.data.numInstallments;
    const fee = parsed.data.conversionFee;
    const monthlyAmount = Math.round(originalAmount / n);
    const totalAmount = originalAmount + fee;

    const { data: plan, error: planError } = await supabase
      .from("installment_plans")
      .insert({
        household_id: gate.householdId,
        name:
          parsed.data.name ?? (item.description?.trim() || "Installment plan"),
        card_label: null,
        total_amount: totalAmount,
        installment_amount: Math.max(1, monthlyAmount),
        currency: DEFAULT_CURRENCY,
        num_installments: n,
        paid_installments: 0,
        status: InstallmentPlanStatus.ACTIVE,
        note: fee > 0 ? `Conversion fee ${fee}` : null,
        created_by: gate.userId,
        card_account_id: item.card_account_id,
        source_transaction_id: item.transaction_id,
        source_billing_item_id: item.id,
      })
      .select("id")
      .single();

    if (planError || !plan?.id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const { error: itemError } = await supabase
      .from("card_billing_items")
      .update({
        is_converted_to_installment: true,
        installment_plan_id: plan.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (itemError) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const next = applyBillingItemConversion({
      statementAmount: Number(month.statement_amount),
      paidAmount: monthPaidAmount,
      itemAmount: originalAmount,
    });

    const { error: monthError } = await supabase
      .from("card_billing_months")
      .update({
        statement_amount: next.statementAmount,
        paid_amount: next.paidAmount,
        status: next.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", month.id);

    if (monthError) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, planId: plan.id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
