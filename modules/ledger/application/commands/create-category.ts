import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  TRANSACTION_DIRECTION_VALUES,
  LEDGER_OPERATION,
  LedgerRpcName,
  type LedgerActionErrorCode,
} from "../ledger-constants";
import { classifyCategoryRpcError, logLedgerFailure } from "../ledger-error";
import {
  CATEGORY_ICON_KEYS,
  DEFAULT_CATEGORY_ICON_KEY,
} from "../icon-constants";

const categoryNameSchema = z.string().trim().min(1).max(80);

export const createCategoryInputSchema = z.object({
  name: categoryNameSchema,
  kind: z.enum(TRANSACTION_DIRECTION_VALUES),
  jarId: z.string().uuid().nullable().optional(),
  iconKey: z.enum(CATEGORY_ICON_KEYS).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export type CreateCategoryErrorCode =
  ProductActionErrorCode | LedgerActionErrorCode;

export type CreateCategoryResult =
  | { ok: true; categoryId: string }
  | { ok: false; code: CreateCategoryErrorCode };

/** Create a household category with an optional jar mapping. */
export async function createCategory(
  raw: CreateCategoryInput,
): Promise<CreateCategoryResult> {
  const parsed = createCategoryInputSchema.safeParse(raw);
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
      LedgerRpcName.CREATE_CATEGORY_WITH_ICON,
      {
        p_name: parsed.data.name,
        p_kind: parsed.data.kind,
        p_jar_id: parsed.data.jarId ?? null,
        p_icon_key: parsed.data.iconKey ?? DEFAULT_CATEGORY_ICON_KEY,
      },
    );

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
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.CREATE_CATEGORY, {
      householdId: gate.householdId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
