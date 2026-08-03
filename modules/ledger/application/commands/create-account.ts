import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  ACCOUNT_TYPE_VALUES,
  AccountType,
  DEFAULT_CARD_DUE_DAY,
  DEFAULT_CARD_STATEMENT_DAY,
} from "../ledger-constants";

const creditCardSettingsSchema = z.object({
  creditLimit: z.number().finite().int().min(0),
  statementDay: z
    .number()
    .int()
    .min(1)
    .max(31)
    .default(DEFAULT_CARD_STATEMENT_DAY),
  dueDay: z.number().int().min(1).max(31).default(DEFAULT_CARD_DUE_DAY),
  linkedBankAccountId: z.string().uuid().nullable().optional(),
});

export const createAccountInputSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    type: z.enum(ACCOUNT_TYPE_VALUES).default(AccountType.CASH),
    openingBalance: z.number().finite().int().min(0).default(0),
    creditCard: creditCardSettingsSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === AccountType.CREDIT_CARD && !value.creditCard) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "credit_card_settings_required",
        path: ["creditCard"],
      });
    }
  });

export type CreateAccountInput = z.infer<typeof createAccountInputSchema>;

export type CreateAccountErrorCode = ProductActionErrorCode;

export type CreateAccountResult =
  { ok: true; accountId: string } | { ok: false; code: CreateAccountErrorCode };

/**
 * Create a cash/wallet or credit-card account for the active household.
 * Credit cards force opening balance 0 and require settings (BR-01).
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

  const isCard = parsed.data.type === AccountType.CREDIT_CARD;
  const openingBalance = isCard ? 0 : parsed.data.openingBalance;

  try {
    const supabase = await createSupabaseServerClient();

    if (isCard && parsed.data.creditCard?.linkedBankAccountId) {
      const { data: linked } = await supabase
        .from("accounts")
        .select("id, type")
        .eq("household_id", gate.householdId)
        .eq("id", parsed.data.creditCard.linkedBankAccountId)
        .eq("is_archived", false)
        .maybeSingle();
      if (!linked || linked.type === AccountType.CREDIT_CARD) {
        return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
      }
    }

    const { data, error } = await supabase
      .from("accounts")
      .insert({
        household_id: gate.householdId,
        name: parsed.data.name,
        type: parsed.data.type,
        opening_balance: openingBalance,
        created_by: gate.userId,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    if (isCard && parsed.data.creditCard) {
      const { error: settingsError } = await supabase
        .from("credit_card_settings")
        .insert({
          account_id: data.id,
          household_id: gate.householdId,
          credit_limit: parsed.data.creditCard.creditLimit,
          statement_day: parsed.data.creditCard.statementDay,
          due_day: parsed.data.creditCard.dueDay,
          linked_bank_account_id:
            parsed.data.creditCard.linkedBankAccountId ?? null,
        });

      if (settingsError) {
        await supabase
          .from("accounts")
          .update({ is_archived: true })
          .eq("id", data.id);
        return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
      }
    }

    return { ok: true, accountId: data.id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
