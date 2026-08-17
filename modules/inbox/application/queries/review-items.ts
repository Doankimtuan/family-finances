import { cache } from "react";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  InboxItemStatus,
  INBOX_ARCHIVED_STATUS_VALUES,
  INBOX_OPERATION,
  InboxSourceType,
} from "../inbox-constants";
import type { InboxReviewItem } from "../inbox-types";
import { logInboxFailure } from "../inbox-error";
import {
  mapInboxRow,
  type InboxItemRow,
  type InboxTransactionDetails,
} from "../mappers/inbox-item.mapper";

const INBOX_SELECT =
  "id, kind, status, title, amount, currency, source_id, source_type, created_at, expires_at, auto_resolved, confidence_score, suggested_jar_id, suggested_category_id, context_json, assigned_to_user_id";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readRelationName(value: unknown): string | null {
  if (Array.isArray(value)) {
    const first = value[0];
    return isRecord(first) && typeof first.name === "string"
      ? first.name
      : null;
  }
  return isRecord(value) && typeof value.name === "string" ? value.name : null;
}

async function enrichWithTransactionDetails(
  supabase: SupabaseServerClient,
  rows: InboxItemRow[],
): Promise<InboxReviewItem[]> {
  const txIds = rows
    .filter((row) => row.source_type === InboxSourceType.TRANSACTION)
    .map((row) => row.source_id);

  const detailsById = new Map<string, InboxTransactionDetails>();

  if (txIds.length > 0) {
    const { data: txs, error } = await supabase
      .from("transactions")
      .select("id, note, categories(name), accounts(name)")
      .in("id", txIds);

    if (error) throw error;

    const transactionRows: unknown = txs;
    if (Array.isArray(transactionRows)) {
      for (const tx of transactionRows) {
        if (!isRecord(tx) || typeof tx.id !== "string") continue;
        detailsById.set(tx.id, {
          note: typeof tx.note === "string" ? tx.note : null,
          categoryName: readRelationName(tx.categories),
          accountName: readRelationName(tx.accounts),
        });
      }
    }
  }

  return rows.map((row) => mapInboxRow(row, detailsById.get(row.source_id)));
}

async function loadOpenInboxItems(): Promise<InboxReviewItem[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("inbox_items")
      .select(INBOX_SELECT)
      .eq("household_id", gate.householdId)
      .eq("status", InboxItemStatus.PENDING)
      .or(`assigned_to_user_id.is.null,assigned_to_user_id.eq.${gate.userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      logInboxFailure(error, INBOX_OPERATION.LIST_OPEN, {
        householdId: gate.householdId,
      });
      return null;
    }

    const items = await enrichWithTransactionDetails(supabase, data ?? []);
    return items;
  } catch (error) {
    logInboxFailure(error, INBOX_OPERATION.LIST_OPEN, {
      householdId: gate.householdId,
    });
    return null;
  }
}

/** Full open queue for screens that need the review items themselves. */
export const listOpenInboxItems = cache(loadOpenInboxItems);

/** Bounded open-queue badge read; avoids loading and enriching every item. */
export const countOpenInboxItems = cache(async (): Promise<number | null> => {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase
      .from("inbox_items")
      .select("id", { count: "exact", head: true })
      .eq("household_id", gate.householdId)
      .eq("status", InboxItemStatus.PENDING)
      .or(`assigned_to_user_id.is.null,assigned_to_user_id.eq.${gate.userId}`);

    if (error) {
      logInboxFailure(error, INBOX_OPERATION.LIST_OPEN, {
        householdId: gate.householdId,
      });
      return null;
    }

    return count ?? 0;
  } catch (error) {
    logInboxFailure(error, INBOX_OPERATION.LIST_OPEN, {
      householdId: gate.householdId,
    });
    return null;
  }
});

export async function listArchivedInboxItems(): Promise<
  InboxReviewItem[] | null
> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("inbox_items")
      .select(INBOX_SELECT)
      .eq("household_id", gate.householdId)
      .in("status", [...INBOX_ARCHIVED_STATUS_VALUES])
      .or(`assigned_to_user_id.is.null,assigned_to_user_id.eq.${gate.userId}`)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      logInboxFailure(error, INBOX_OPERATION.LIST_ARCHIVED, {
        householdId: gate.householdId,
      });
      return null;
    }

    const items = await enrichWithTransactionDetails(supabase, data ?? []);
    return items;
  } catch (error) {
    logInboxFailure(error, INBOX_OPERATION.LIST_ARCHIVED, {
      householdId: gate.householdId,
    });
    return null;
  }
}

export async function getInboxItem(
  inboxItemId: string,
): Promise<InboxReviewItem | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("inbox_items")
      .select(INBOX_SELECT)
      .eq("household_id", gate.householdId)
      .eq("id", inboxItemId)
      .or(`assigned_to_user_id.is.null,assigned_to_user_id.eq.${gate.userId}`)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        logInboxFailure(error, INBOX_OPERATION.GET_ITEM, {
          householdId: gate.householdId,
          inboxItemId,
        });
      }
      return null;
    }

    const [item] = await enrichWithTransactionDetails(supabase, [data]);
    return item ?? null;
  } catch (error) {
    logInboxFailure(error, INBOX_OPERATION.GET_ITEM, {
      householdId: gate.householdId,
      inboxItemId,
    });
    return null;
  }
}
