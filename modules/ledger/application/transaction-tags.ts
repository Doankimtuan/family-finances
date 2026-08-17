import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { Result } from "@/modules/shared-kernel/application/result";
import {
  TRANSACTION_TAG_COLOR_KEYS,
  TRANSACTION_TAG_ICON_KEYS,
  MAX_TRANSACTION_TAGS,
  normalizeTransactionTagColorKey,
  normalizeTransactionTagIconKey,
  type TransactionTagColorKey,
  type TransactionTagIconKey,
} from "./ledger-constants";
import {
  classifyTransactionTagRpcError,
  LEDGER_OPERATION,
  logLedgerFailure,
} from "./ledger-error";
import type { TransactionTag } from "./transaction-types";

export const transactionTagInputSchema = z.object({
  name: z.string().trim().min(1).max(64),
  iconKey: z.enum(TRANSACTION_TAG_ICON_KEYS as [string, ...string[]]),
  colorKey: z
    .enum(TRANSACTION_TAG_COLOR_KEYS as [string, ...string[]])
    .nullable(),
});

export type TransactionTagInput = z.infer<typeof transactionTagInputSchema>;
export type TransactionTagActionErrorCode = ProductActionErrorCode;
export type TransactionTagActionResult = Result<
  { tag: TransactionTag },
  TransactionTagActionErrorCode
>;

function toTransactionTag(row: {
  id: string;
  name: string;
  icon_key: string;
  color_key: string | null;
  archived_at?: string | null;
}): TransactionTag {
  return {
    id: row.id,
    name: row.name,
    iconKey: normalizeTransactionTagIconKey(row.icon_key),
    colorKey: normalizeTransactionTagColorKey(row.color_key),
    archivedAt: row.archived_at ?? null,
  };
}

export async function listTransactionTags(options?: {
  includeArchived?: boolean;
}): Promise<TransactionTag[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("transaction_tags")
      .select("id, name, icon_key, color_key, archived_at")
      .eq("household_id", gate.householdId)
      .order("archived_at", { ascending: true, nullsFirst: true })
      .order("name", { ascending: true });
    if (!options?.includeArchived) query = query.is("archived_at", null);
    const { data, error } = await query;
    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.LIST_TRANSACTION_TAGS, {
        householdId: gate.householdId,
      });
      return null;
    }
    return (data ?? []).map(toTransactionTag);
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_TRANSACTION_TAGS, {
      householdId: gate.householdId,
    });
    return null;
  }
}

export async function createTransactionTag(
  raw: TransactionTagInput,
): Promise<TransactionTagActionResult> {
  const parsed = transactionTagInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("transaction_tags")
      .insert({
        household_id: gate.householdId,
        name: parsed.data.name,
        icon_key: parsed.data.iconKey,
        color_key: parsed.data.colorKey ?? null,
      })
      .select("id, name, icon_key, color_key, archived_at")
      .single();
    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.CREATE_TRANSACTION_TAG, {
        householdId: gate.householdId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    if (!data) {
      logLedgerFailure(null, LEDGER_OPERATION.CREATE_TRANSACTION_TAG, {
        householdId: gate.householdId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, tag: toTransactionTag(data) };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.CREATE_TRANSACTION_TAG, {
      householdId: gate.householdId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export async function updateTransactionTag(
  tagId: string,
  raw: TransactionTagInput,
): Promise<TransactionTagActionResult> {
  if (!z.string().uuid().safeParse(tagId).success)
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  const parsed = transactionTagInputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok)
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("transaction_tags")
      .update({
        name: parsed.data.name,
        icon_key: parsed.data.iconKey,
        color_key: parsed.data.colorKey ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tagId)
      .eq("household_id", gate.householdId)
      .is("archived_at", null)
      .select("id, name, icon_key, color_key, archived_at")
      .single();
    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.UPDATE_TRANSACTION_TAG, {
        householdId: gate.householdId,
        tagId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    if (!data) {
      logLedgerFailure(null, LEDGER_OPERATION.UPDATE_TRANSACTION_TAG, {
        householdId: gate.householdId,
        tagId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, tag: toTransactionTag(data) };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.UPDATE_TRANSACTION_TAG, {
      householdId: gate.householdId,
      tagId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export async function archiveTransactionTag(
  tagId: string,
): Promise<Result<object, TransactionTagActionErrorCode>> {
  if (!z.string().uuid().safeParse(tagId).success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("transaction_tags")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", tagId)
      .eq("household_id", gate.householdId)
      .is("archived_at", null);
    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.ARCHIVE_TRANSACTION_TAG, {
        householdId: gate.householdId,
        tagId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.ARCHIVE_TRANSACTION_TAG, {
      householdId: gate.householdId,
      tagId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export async function setTransactionTags(
  transactionId: string,
  tagIds: string[],
): Promise<Result<object, TransactionTagActionErrorCode>> {
  const validIds = z
    .array(z.string().uuid())
    .max(MAX_TRANSACTION_TAGS)
    .safeParse(tagIds);
  if (
    !z.string().uuid().safeParse(transactionId).success ||
    !validIds.success
  ) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  const uniqueTagIds = [...new Set(validIds.data)];

  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("set_transaction_tags", {
      p_transaction_id: transactionId,
      p_tag_ids: uniqueTagIds,
    });
    if (error) {
      const code = classifyTransactionTagRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logLedgerFailure(error, LEDGER_OPERATION.SET_TRANSACTION_TAGS, {
          transactionId,
        });
      }
      return {
        ok: false,
        code,
      };
    }
    return { ok: true };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.SET_TRANSACTION_TAGS, {
      transactionId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export type { TransactionTagColorKey, TransactionTagIconKey };
