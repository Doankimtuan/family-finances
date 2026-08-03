import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";

export const archiveAccountInputSchema = z.object({
  accountId: z.string().uuid(),
});

export type ArchiveAccountInput = z.infer<typeof archiveAccountInputSchema>;

export type ArchiveAccountResult =
  { ok: true } | { ok: false; code: ProductActionErrorCode };

/**
 * Soft-archive a household account (hidden from Real Position lists).
 */
export async function archiveAccount(
  raw: ArchiveAccountInput,
): Promise<ArchiveAccountResult> {
  const parsed = archiveAccountInputSchema.safeParse(raw);
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
    const { data, error } = await supabase
      .from("accounts")
      .update({ is_archived: true })
      .eq("id", parsed.data.accountId)
      .eq("household_id", gate.householdId)
      .eq("is_archived", false)
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    if (!data?.id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    return { ok: true };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
