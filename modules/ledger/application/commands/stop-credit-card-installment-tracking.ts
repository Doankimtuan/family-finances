import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { CreditCardInstallmentStatus } from "../ledger-constants";

export const stopCreditCardInstallmentTrackingInputSchema = z.object({
  installmentId: z.string().uuid(),
});

export type StopCreditCardInstallmentTrackingInput = z.infer<
  typeof stopCreditCardInstallmentTrackingInputSchema
>;
export type StopCreditCardInstallmentTrackingResult =
  { ok: true } | { ok: false; code: ProductActionErrorCode };

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
    if (error || !data?.id)
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    return { ok: true };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
