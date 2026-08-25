import { cache } from "react";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  InboxItemStatus,
  INBOX_ARCHIVED_STATUS_VALUES,
  INBOX_OPERATION,
  INBOX_ITEM_KIND_VALUES,
  INBOX_OPEN_PAGE_SIZE,
  InboxSourceType,
  InboxItemKind,
  mapInboxKind,
} from "../inbox-constants";
import type { InboxPage, InboxReviewItem } from "../inbox-types";
import { logInboxFailure } from "../inbox-error";
import { isFinancialScope } from "@/modules/shared-kernel/application/financial-scope";
import { resolveFinancialCapabilities } from "@/modules/shared-kernel/application/financial-ownership";
import { listActiveMembershipIds } from "@/modules/tenancy/application/list-active-membership-ids";
import {
  resolveInboxSourceCapabilities,
  type InboxSourceCapabilities,
} from "../inbox-source-capabilities";
import {
  mapInboxRow,
  type InboxItemRow,
  type InboxTransactionDetails,
} from "../mappers/inbox-item.mapper";

const INBOX_SELECT =
  "id, kind, status, title, amount, currency, source_id, source_type, created_at, expires_at, auto_resolved, confidence_score, suggested_jar_id, suggested_category_id, context_json, assigned_to_user_id, read_at";

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

type SourceOwnership = {
  financialScope: string | null;
  ownerMembershipId: string | null;
};

function readRelationOwnership(value: unknown): SourceOwnership | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!isRecord(row)) return null;
  return {
    financialScope:
      typeof row.financial_scope === "string" ? row.financial_scope : null,
    ownerMembershipId:
      typeof row.owner_membership_id === "string"
        ? row.owner_membership_id
        : null,
  };
}

function readContextValue(row: InboxItemRow, key: string): string | null {
  const context = isRecord(row.context_json?.data)
    ? row.context_json.data
    : row.context_json;
  const value = context?.[key];
  return typeof value === "string" ? value : null;
}

async function enrichWithTransactionDetails(
  supabase: SupabaseServerClient,
  rows: InboxItemRow[],
  householdId: string,
  activeMembershipId: string,
): Promise<InboxReviewItem[]> {
  const txIds = rows
    .filter((row) => row.source_type === InboxSourceType.TRANSACTION)
    .map((row) => row.source_id);

  const detailsById = new Map<string, InboxTransactionDetails>();
  const ownershipByItemId = new Map<string, SourceOwnership>();
  const unavailableSourceIds = new Set<string>();

  if (txIds.length > 0) {
    const { data: txs, error } = await supabase
      .from("transactions")
      .select(
        "id, note, categories(name), accounts(name, financial_scope, owner_membership_id)",
      )
      .in("id", txIds);

    if (error) txIds.forEach((id) => unavailableSourceIds.add(id));

    const transactionRows: unknown = txs;
    if (Array.isArray(transactionRows)) {
      for (const tx of transactionRows) {
        if (!isRecord(tx) || typeof tx.id !== "string") continue;
        detailsById.set(tx.id, {
          note: typeof tx.note === "string" ? tx.note : null,
          categoryName: readRelationName(tx.categories),
          accountName: readRelationName(tx.accounts),
        });
        const ownership = readRelationOwnership(tx.accounts);
        if (ownership) ownershipByItemId.set(tx.id, ownership);
      }
    }
  }

  const savingIds = rows.flatMap((row) => {
    const kind = mapInboxKind(row.kind);
    if (
      kind !== InboxItemKind.SAVINGS_MATURITY &&
      kind !== InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION
    ) {
      return [];
    }
    return [readContextValue(row, "savingId") ?? row.source_id];
  });

  if (savingIds.length > 0) {
    const { data: savings, error } = await supabase
      .from("savings")
      .select("id, financial_scope, owner_membership_id")
      .eq("household_id", householdId)
      .in("id", [...new Set(savingIds)]);
    if (error) savingIds.forEach((id) => unavailableSourceIds.add(id));
    for (const saving of savings ?? []) {
      if (!isRecord(saving) || typeof saving.id !== "string") continue;
      ownershipByItemId.set(saving.id, {
        financialScope:
          typeof saving.financial_scope === "string"
            ? saving.financial_scope
            : null,
        ownerMembershipId:
          typeof saving.owner_membership_id === "string"
            ? saving.owner_membership_id
            : null,
      });
    }
  }

  const loanIds = rows.flatMap((row) => {
    const kind = mapInboxKind(row.kind);
    if (
      kind !== InboxItemKind.EMI_COMPLETE &&
      kind !== InboxItemKind.LOAN_PAYMENT_ATTENTION
    ) {
      return [];
    }
    return [readContextValue(row, "loanId") ?? row.source_id];
  });
  if (loanIds.length > 0) {
    const { data: loans, error } = await supabase
      .from("loans")
      .select("id, financial_scope, owner_membership_id")
      .eq("household_id", householdId)
      .in("id", [...new Set(loanIds)]);
    if (error) loanIds.forEach((id) => unavailableSourceIds.add(id));
    for (const loan of loans ?? []) {
      if (!isRecord(loan) || typeof loan.id !== "string") continue;
      ownershipByItemId.set(loan.id, {
        financialScope:
          typeof loan.financial_scope === "string"
            ? loan.financial_scope
            : null,
        ownerMembershipId:
          typeof loan.owner_membership_id === "string"
            ? loan.owner_membership_id
            : null,
      });
    }
  }

  const debtIds = rows.flatMap((row) => {
    const kind = mapInboxKind(row.kind);
    if (
      kind !== InboxItemKind.EMI_COMPLETE &&
      kind !== InboxItemKind.DEBT_PAYMENT_ATTENTION
    ) {
      return [];
    }
    return [readContextValue(row, "debtId") ?? row.source_id];
  });
  if (debtIds.length > 0) {
    const { data: debts, error } = await supabase
      .from("liabilities")
      .select("id, financial_scope, owner_membership_id")
      .eq("household_id", householdId)
      .in("id", [...new Set(debtIds)]);
    if (error) debtIds.forEach((id) => unavailableSourceIds.add(id));
    for (const debt of debts ?? []) {
      if (!isRecord(debt) || typeof debt.id !== "string") continue;
      ownershipByItemId.set(debt.id, {
        financialScope:
          typeof debt.financial_scope === "string"
            ? debt.financial_scope
            : null,
        ownerMembershipId:
          typeof debt.owner_membership_id === "string"
            ? debt.owner_membership_id
            : null,
      });
    }
  }

  const ownerMembershipIds = [
    ...new Set(
      [...ownershipByItemId.values()].flatMap((ownership) =>
        ownership.ownerMembershipId ? [ownership.ownerMembershipId] : [],
      ),
    ),
  ];
  const activeOwnerMembershipIds = await listActiveMembershipIds(
    supabase,
    householdId,
    ownerMembershipIds,
  );

  const sourceCapabilitiesByItemId = new Map<string, InboxSourceCapabilities>();
  for (const row of rows) {
    const kind = mapInboxKind(row.kind);
    if (!kind) continue;
    const sourceId = sourceIdForOwnership(row, kind);
    const ownership = ownershipByItemId.get(sourceId);
    const sourceScope = ownership?.financialScope ?? "";
    const financialCapabilities =
      ownership && isFinancialScope(sourceScope)
        ? resolveFinancialCapabilities(
            {
              financialScope: sourceScope,
              ownerMembershipId: ownership.ownerMembershipId,
            },
            activeMembershipId,
            activeOwnerMembershipIds == null ||
              ownership.ownerMembershipId == null ||
              activeOwnerMembershipIds.has(ownership.ownerMembershipId),
          )
        : null;
    sourceCapabilitiesByItemId.set(
      row.id,
      unavailableSourceIds.has(sourceId)
        ? resolveInboxSourceCapabilities(kind, null)
        : resolveInboxSourceCapabilities(kind, financialCapabilities),
    );
  }

  return rows.flatMap((row) => {
    const kind = mapInboxKind(row.kind);
    const item = mapInboxRow(
      row,
      detailsById.get(row.source_id),
      sourceCapabilitiesByItemId.get(row.id),
      kind != null && unavailableSourceIds.has(sourceIdForOwnership(row, kind)),
    );
    return item ? [item] : [];
  });
}

function sourceIdForOwnership(row: InboxItemRow, kind: InboxItemKind): string {
  const contextKey =
    kind === InboxItemKind.SAVINGS_MATURITY ||
    kind === InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION
      ? "savingId"
      : kind === InboxItemKind.LOAN_PAYMENT_ATTENTION ||
          (kind === InboxItemKind.EMI_COMPLETE &&
            readContextValue(row, "loanId"))
        ? "loanId"
        : kind === InboxItemKind.DEBT_PAYMENT_ATTENTION ||
            (kind === InboxItemKind.EMI_COMPLETE &&
              readContextValue(row, "debtId"))
          ? "debtId"
          : null;
  return contextKey == null
    ? row.source_id
    : (readContextValue(row, contextKey) ?? row.source_id);
}

/** Legacy kinds must never re-enter the active queue (Prompt 13A). */
const ACTIVE_QUEUE_KIND_FILTER = INBOX_ITEM_KIND_VALUES.map(
  (kind) => `kind.eq.${kind}`,
).join(",");

async function loadOpenInboxItems(): Promise<InboxReviewItem[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const baseQuery = supabase
      .from("inbox_items")
      .select(INBOX_SELECT)
      .eq("household_id", gate.householdId)
      .eq("status", InboxItemStatus.PENDING)
      .or(ACTIVE_QUEUE_KIND_FILTER)
      .or(`assigned_to_user_id.is.null,assigned_to_user_id.eq.${gate.userId}`);
    const boundedQuery =
      typeof baseQuery.limit === "function"
        ? baseQuery.limit(INBOX_OPEN_PAGE_SIZE)
        : baseQuery;
    const { data, error } = await boundedQuery.order("created_at", {
      ascending: false,
    });
    if (error) throw error;
    return await enrichWithTransactionDetails(
      supabase,
      data ?? [],
      gate.householdId,
      gate.membershipId,
    );
  } catch (error) {
    logInboxFailure(error, INBOX_OPERATION.LIST_OPEN, {
      householdId: gate.householdId,
    });
    return null;
  }
}

/** Full open queue for screens that need the review items themselves. */
export const listOpenInboxItems = cache(loadOpenInboxItems);

async function loadOpenInboxPage(
  cursor?: { createdAt: string; id: string } | null,
): Promise<InboxPage | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("inbox_items")
      .select(INBOX_SELECT)
      .eq("household_id", gate.householdId)
      .eq("status", InboxItemStatus.PENDING)
      .or(ACTIVE_QUEUE_KIND_FILTER)
      .or(`assigned_to_user_id.is.null,assigned_to_user_id.eq.${gate.userId}`)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(INBOX_OPEN_PAGE_SIZE + 1);

    if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
      );
    }

    const { data, error } = await query;
    if (error) {
      logInboxFailure(error, INBOX_OPERATION.LIST_OPEN, {
        householdId: gate.householdId,
      });
      return null;
    }

    const rows = (data ?? []) as InboxItemRow[];
    const hasMore = rows.length > INBOX_OPEN_PAGE_SIZE;
    const pageRows = rows.slice(0, INBOX_OPEN_PAGE_SIZE);
    const items = await enrichWithTransactionDetails(
      supabase,
      pageRows,
      gate.householdId,
      gate.membershipId,
    );
    const last = pageRows.at(-1);
    return {
      items,
      nextCursor:
        hasMore && last ? { createdAt: last.created_at, id: last.id } : null,
    };
  } catch (error) {
    logInboxFailure(error, INBOX_OPERATION.LIST_OPEN, {
      householdId: gate.householdId,
    });
    return null;
  }
}

export const listOpenInboxPage = cache(loadOpenInboxPage);

/** Navigation badge: unread open items only. */
export const countUnreadOpenInboxItems = cache(
  async (): Promise<number | null> => {
    const gate = await assertMoneyActionAllowed();
    if (!gate.ok) return null;

    try {
      const supabase = await createSupabaseServerClient();
      const { count, error } = await supabase
        .from("inbox_items")
        .select("id", { count: "exact", head: true })
        .eq("household_id", gate.householdId)
        .eq("status", InboxItemStatus.PENDING)
        .is("read_at", null)
        .or(ACTIVE_QUEUE_KIND_FILTER)
        .or(
          `assigned_to_user_id.is.null,assigned_to_user_id.eq.${gate.userId}`,
        );

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
  },
);

/** Compatibility action-required count; intentionally separate from unread. */
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
      .or(ACTIVE_QUEUE_KIND_FILTER)
      .or(`assigned_to_user_id.is.null,assigned_to_user_id.eq.${gate.userId}`);
    if (error) throw error;
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
      .or(ACTIVE_QUEUE_KIND_FILTER)
      .or(`assigned_to_user_id.is.null,assigned_to_user_id.eq.${gate.userId}`)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      logInboxFailure(error, INBOX_OPERATION.LIST_ARCHIVED, {
        householdId: gate.householdId,
      });
      return null;
    }

    return await enrichWithTransactionDetails(
      supabase,
      data ?? [],
      gate.householdId,
      gate.membershipId,
    );
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

    const [item] = await enrichWithTransactionDetails(
      supabase,
      [data],
      gate.householdId,
      gate.membershipId,
    );
    return item ?? null;
  } catch (error) {
    logInboxFailure(error, INBOX_OPERATION.GET_ITEM, {
      householdId: gate.householdId,
      inboxItemId,
    });
    return null;
  }
}
