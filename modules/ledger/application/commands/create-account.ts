import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { ACCOUNT_TYPE_VALUES, AccountType } from "../ledger-constants";

export const createAccountInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(ACCOUNT_TYPE_VALUES).default(AccountType.CASH),
  openingBalance: z.number().finite().int().min(0).default(0),
});

export type CreateAccountInput = z.infer<typeof createAccountInputSchema>;

export type CreateAccountErrorCode = ProductActionErrorCode;

export type CreateAccountResult =
  { ok: true; accountId: string } | { ok: false; code: CreateAccountErrorCode };

/**
 * Create a cash/wallet account for the active household (ledger Real position).
 */
export async function createAccount(
  raw: CreateAccountInput,
): Promise<CreateAccountResult> {
  const parsed = createAccountInputSchema.safeParse(raw);
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
      .insert({
        household_id: gate.householdId,
        name: parsed.data.name,
        type: parsed.data.type,
        opening_balance: parsed.data.openingBalance,
        created_by: gate.userId,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, accountId: data.id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
