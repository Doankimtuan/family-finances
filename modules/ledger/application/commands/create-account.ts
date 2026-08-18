import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { resolveCreationOwnership } from "@/modules/tenancy/application/resolve-creation-ownership";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { Result } from "@/modules/shared-kernel/application/result";
import { AccountType } from "../ledger-constants";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";
import {
  createAccountInputSchema,
  type CreateAccountInput,
} from "./create-account.schema";

export { createAccountInputSchema } from "./create-account.schema";
export type { CreateAccountInput } from "./create-account.schema";

export type CreateAccountErrorCode = ProductActionErrorCode;

export type CreateAccountResult = Result<
  { accountId: string },
  CreateAccountErrorCode
>;

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

  const ownership = await resolveCreationOwnership(
    gate.householdId,
    parsed.data.financialScope,
  );
  if (!ownership)
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP };

  const isCard = parsed.data.type === AccountType.CREDIT_CARD;
  const openingBalance = isCard ? 0 : parsed.data.openingBalance;

  try {
    const supabase = await createSupabaseServerClient();

    if (isCard && parsed.data.creditCard?.linkedBankAccountId) {
      const { data: linked, error: linkedError } = await supabase
        .from("accounts")
        .select("id, type")
        .eq("household_id", gate.householdId)
        .eq("id", parsed.data.creditCard.linkedBankAccountId)
        .eq("is_archived", false)
        .maybeSingle();
      if (linkedError) {
        logLedgerFailure(linkedError, LEDGER_OPERATION.CREATE_ACCOUNT, {
          householdId: gate.householdId,
          accountId: parsed.data.creditCard.linkedBankAccountId,
        });
        return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
      }
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
        financial_scope: ownership.financialScope,
        owner_membership_id: ownership.ownerMembershipId,
      })
      .select("id")
      .single();

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.CREATE_ACCOUNT, {
        householdId: gate.householdId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    if (!data?.id) {
      logLedgerFailure(null, LEDGER_OPERATION.CREATE_ACCOUNT, {
        householdId: gate.householdId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    if (isCard && parsed.data.creditCard) {
      const { error: settingsError } = await supabase
        .from("credit_card_settings")
        .insert({
          account_id: data.id,
          household_id: gate.householdId,
          credit_limit: parsed.data.creditCard.creditLimit ?? 0,
          statement_day: parsed.data.creditCard.statementDay,
          due_day: parsed.data.creditCard.dueDay,
          linked_bank_account_id:
            parsed.data.creditCard.linkedBankAccountId ?? null,
        });

      if (settingsError) {
        logLedgerFailure(settingsError, LEDGER_OPERATION.CREATE_ACCOUNT, {
          householdId: gate.householdId,
          accountId: data.id,
        });
        const { error: archiveError } = await supabase
          .from("accounts")
          .update({ is_archived: true })
          .eq("id", data.id);
        if (archiveError) {
          logLedgerFailure(archiveError, LEDGER_OPERATION.CREATE_ACCOUNT, {
            householdId: gate.householdId,
            accountId: data.id,
          });
        }
        return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
      }
    }

    return { ok: true, accountId: data.id };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.CREATE_ACCOUNT, {
      householdId: gate.householdId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
