import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { CreditCardInstallmentStatus } from "../ledger-constants";
import type { Result } from "@/modules/shared-kernel/application/result";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";

export const stopCreditCardInstallmentTrackingInputSchema = z.object({
  installmentId: z.string().uuid(),
});

export type StopCreditCardInstallmentTrackingInput = z.infer<
  typeof stopCreditCardInstallmentTrackingInputSchema
>;
export type StopCreditCardInstallmentTrackingResult = Result<
  object,
  ProductActionErrorCode
>;

/** Stops only ViNha tracking. It does not cancel a bank installment agreement. */
export async function stopCreditCardInstallmentTracking(
  raw: StopCreditCardInstallmentTrackingInput,
): Promise<StopCreditCardInstallmentTrackingResult> {
  const parsed = stopCreditCardInstallmentTrackingInputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok)
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("credit_card_installments")
      .update({ status: CreditCardInstallmentStatus.STOPPED })
      .eq("id", parsed.data.installmentId)
      .eq("household_id", gate.householdId)
      .in("status", [
        CreditCardInstallmentStatus.ACTIVE,
        CreditCardInstallmentStatus.REVIEW_REQUIRED,
      ])
      .select("id")
      .maybeSingle();
    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.STOP_CREDIT_CARD_INSTALLMENT, {
        householdId: gate.householdId,
        installmentId: parsed.data.installmentId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    if (!data?.id)
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    return { ok: true };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.STOP_CREDIT_CARD_INSTALLMENT, {
      householdId: gate.householdId,
      installmentId: parsed.data.installmentId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
