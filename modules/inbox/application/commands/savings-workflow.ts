import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import type { Result } from "@/modules/shared-kernel/application/result";
import {
  InboxItemKind,
  InboxItemStatus,
  InboxSourceType,
  INBOX_OPERATION,
} from "../inbox-constants";
import { classifyInboxRpcError, logInboxFailure } from "../inbox-error";
import type { InboxCommandErrorCode } from "../inbox-error";

export type SavingsMaturityInboxItem = {
  inboxItemId: string;
  savingId: string;
  cycleId: string;
  context: Record<string, unknown>;
};

export type SavingsEarlyWithdrawalInboxContext = Readonly<{
  savingId: string;
  cycleId: string;
  principal: number;
  accruedInterest: number;
  eligibleInterest: number;
  penaltyAmount: number;
  netReturned: number;
  penaltyStrategy: string;
  daysHeld: number;
  totalTermDays: number;
  quoteReady: boolean;
  settlementAccountId: string;
  warnPenalty: boolean;
  cascadeDay: string;
}>;

export type SavingsInboxResult<T extends object> = Result<
  T,
  InboxCommandErrorCode
>;

export async function listPendingSavingsMaturityInboxItems(
  householdId: string,
): Promise<SavingsMaturityInboxItem[] | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("inbox_items")
      .select("id, source_id, context_json")
      .eq("household_id", householdId)
      .eq("kind", InboxItemKind.SAVINGS_MATURED)
      .eq("status", InboxItemStatus.PENDING);

    if (error) {
      logInboxFailure(error, INBOX_OPERATION.SAVINGS_MATURITY_SYNC, {
        householdId,
      });
      return null;
    }

    return (data ?? []).flatMap((item) => {
      const context = isRecord(item.context_json) ? item.context_json : {};
      const savingId = readString(context.savingId) ?? item.source_id;
      const cycleId = readString(context.cycleId);
      return typeof savingId === "string" && cycleId
        ? [{ inboxItemId: item.id, savingId, cycleId, context }]
        : [];
    });
  } catch (error) {
    logInboxFailure(error, INBOX_OPERATION.SAVINGS_MATURITY_SYNC, {
      householdId,
    });
    return null;
  }
}

export async function updateSavingsMaturityInboxItem(input: {
  householdId: string;
  inboxItemId: string;
  context: Record<string, unknown>;
}): Promise<SavingsInboxResult<{ updated: boolean }>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("inbox_items")
      .update({
        context_json: input.context,
        updated_at: new Date().toISOString(),
      })
      .eq("household_id", input.householdId)
      .eq("id", input.inboxItemId);

    if (error) {
      return mapFailure(error, input);
    }
    return { ok: true, updated: true };
  } catch (error) {
    return mapFailure(error, input);
  }
}

export async function upsertSavingsEarlyWithdrawalInboxItem(input: {
  householdId: string;
  savingId: string;
  amount: number;
  currency: string;
  title: string;
  context: SavingsEarlyWithdrawalInboxContext;
}): Promise<SavingsInboxResult<{ inboxItemId: string }>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("inbox_items")
      .insert({
        household_id: input.householdId,
        kind: InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION,
        status: InboxItemStatus.PENDING,
        source_type: InboxSourceType.GUIDED,
        source_id: input.savingId,
        amount: input.amount,
        currency: input.currency,
        title: input.title,
        context_json: input.context,
      })
      .select("id")
      .maybeSingle();

    if (!error && data?.id) return { ok: true, inboxItemId: data.id };
    if (!error) return mapFailure(null, input, true);

    const { data: updated, error: updateError } = await supabase
      .from("inbox_items")
      .update({
        status: InboxItemStatus.PENDING,
        amount: input.amount,
        title: input.title,
        context_json: input.context,
        updated_at: new Date().toISOString(),
      })
      .eq("household_id", input.householdId)
      .eq("source_type", InboxSourceType.GUIDED)
      .eq("source_id", input.savingId)
      .eq("kind", InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION)
      .select("id")
      .maybeSingle();

    if (updateError) return mapFailure(updateError, input);
    if (!updated?.id) return mapFailure(null, input, true);
    return { ok: true, inboxItemId: updated.id };
  } catch (error) {
    return mapFailure(error, input);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function mapFailure(
  error: unknown,
  input: { householdId: string; savingId?: string; inboxItemId?: string },
  responseInvalid = false,
): { ok: false; code: InboxCommandErrorCode } {
  const code = classifyInboxRpcError(error);
  if (responseInvalid || code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
    logInboxFailure(error, INBOX_OPERATION.SAVINGS_EARLY_WITHDRAWAL_UPSERT, {
      householdId: input.householdId,
      inboxItemId: input.inboxItemId,
      itemKind: InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION,
      responseInvalid,
    });
  }
  return { ok: false, code };
}
