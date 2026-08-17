import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  LEDGER_ACTION_ERROR_CODE,
  TRANSACTION_DIRECTION_VALUES,
  type LedgerActionErrorCode,
} from "../ledger-constants";
import { isCategoryJarMapped } from "../category-jar-policy";
import { classifyCategoryRpcError } from "../ledger-error";

export const createCategoryInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.enum(TRANSACTION_DIRECTION_VALUES),
  jarId: z.string().uuid(),
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export type CreateCategoryErrorCode =
  ProductActionErrorCode | LedgerActionErrorCode;

export type CreateCategoryResult =
  | { ok: true; categoryId: string }
  | { ok: false; code: CreateCategoryErrorCode };

/**
 * Create a household category bound N:1 to an active jar (BR-12 / AC-CAT-01).
 */
export async function createCategory(
  raw: CreateCategoryInput,
): Promise<CreateCategoryResult> {
  const parsed = createCategoryInputSchema.safeParse(raw);
  if (!parsed.success) {
    if (!isCategoryJarMapped({ isSystem: false, jarId: raw?.jarId })) {
      return { ok: false, code: LEDGER_ACTION_ERROR_CODE.CATEGORY_UNMAPPED };
    }
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  if (!isCategoryJarMapped({ isSystem: false, jarId: parsed.data.jarId })) {
    return { ok: false, code: LEDGER_ACTION_ERROR_CODE.CATEGORY_UNMAPPED };
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
    const { data, error } = await supabase.rpc("create_category", {
      p_name: parsed.data.name,
      p_kind: parsed.data.kind,
      p_jar_id: parsed.data.jarId,
    });

    if (error) {
      const classified = classifyCategoryRpcError(error);
      if (classified) return { ok: false, code: classified };
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const payload = data as { category_id?: string } | null;
    if (!payload?.category_id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, categoryId: payload.category_id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
