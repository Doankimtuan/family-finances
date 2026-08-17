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
import { produceInboxItem } from "./produce-inbox-item";

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
      .eq("kind", InboxItemKind.SAVINGS_MATURITY)
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
  const result = await produceInboxItem({
    householdId: input.householdId,
    kind: InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION,
    sourceType: InboxSourceType.GUIDED,
    sourceId: input.savingId,
    amount: input.amount,
    currency: input.currency,
    title: input.title,
    context: input.context,
  });
  if (!result.ok) {
    return mapFailureFromCode(result.code, input);
  }
  return { ok: true, inboxItemId: result.inboxItemId };
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

function mapFailureFromCode(
  code: InboxCommandErrorCode,
  input: { householdId: string; savingId?: string; inboxItemId?: string },
): { ok: false; code: InboxCommandErrorCode } {
  if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
    logInboxFailure(null, INBOX_OPERATION.SAVINGS_EARLY_WITHDRAWAL_UPSERT, {
      householdId: input.householdId,
      inboxItemId: input.inboxItemId,
      itemKind: InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION,
    });
  }
  return { ok: false, code };
}
