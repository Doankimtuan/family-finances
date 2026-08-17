/**
 * Canonical Inbox producer gateway — typed application wrapper (Prompt 13B).
 *
 * Source domains express "what happened + what Inbox decision should exist"
 * through a discriminated union keyed by canonical Inbox kind. The physical
 * inbox_items shape (status, dedupe, expiry, context envelope) is owned by the
 * gateway function `produce_inbox_item` on the database.
 */

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { InboxItemKind, InboxSourceType } from "../inbox-constants";
import type { Result } from "@/modules/shared-kernel/application/result";
import { classifyInboxRpcError, logInboxFailure } from "../inbox-error";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import type { InboxCommandErrorCode } from "../inbox-error";
import { INBOX_OPERATION } from "../inbox-constants";

export type ProduceInboxItemInput = {
  householdId: string;
  kind: InboxItemKind;
  sourceType: InboxSourceType;
  sourceId: string;
  amount: number;
  currency: string;
  title: string;
  context: Record<string, unknown>;
  assignedToUserId?: string | null;
  suggestedJarId?: string | null;
  suggestedCategoryId?: string | null;
};

export type ProduceInboxItemResult = Result<
  { inboxItemId: string; idempotent: boolean },
  InboxCommandErrorCode
>;

/**
 * Create (or idempotently refresh) an Inbox decision item through the
 * canonical gateway. Dedupe identity, lifecycle status, expiry defaults and
 * the context envelope are owned by the gateway, not the caller.
 */
export async function produceInboxItem(
  input: ProduceInboxItemInput,
): Promise<ProduceInboxItemResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("produce_inbox_item", {
      p_household_id: input.householdId,
      p_kind: input.kind,
      p_source_type: input.sourceType,
      p_source_id: input.sourceId,
      p_amount: input.amount,
      p_currency: input.currency,
      p_title: input.title,
      p_context: input.context,
      p_assigned_to_user_id: input.assignedToUserId ?? null,
      p_suggested_jar_id: input.suggestedJarId ?? null,
      p_suggested_category_id: input.suggestedCategoryId ?? null,
    });

    if (error) {
      const code = classifyInboxRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logInboxFailure(
          error,
          INBOX_OPERATION.SAVINGS_EARLY_WITHDRAWAL_UPSERT,
          {
            householdId: input.householdId,
            itemKind: input.kind,
          },
        );
      }
      return { ok: false, code };
    }

    const record =
      data && typeof data === "object"
        ? (data as { inbox_item_id?: unknown; idempotent?: unknown })
        : null;
    const inboxItemId =
      record && typeof record.inbox_item_id === "string"
        ? record.inbox_item_id
        : "";
    if (!inboxItemId) {
      logInboxFailure(null, INBOX_OPERATION.SAVINGS_EARLY_WITHDRAWAL_UPSERT, {
        householdId: input.householdId,
        itemKind: input.kind,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return {
      ok: true,
      inboxItemId,
      idempotent: record?.idempotent === true,
    };
  } catch (error) {
    logInboxFailure(error, INBOX_OPERATION.SAVINGS_EARLY_WITHDRAWAL_UPSERT, {
      householdId: input.householdId,
      itemKind: input.kind,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
