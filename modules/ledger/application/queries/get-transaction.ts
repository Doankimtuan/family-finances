import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  mapTransactionRow,
  transactionMatchesTagFilter,
  type LedgerTransaction,
  type TransactionDirection,
} from "../transaction-types";
import {
  createTransactionActivities,
  transactionActivityMatchesFilter,
  TransactionProductEvent,
  type TransactionActivity,
} from "../transaction-activity";
import { TransactionOwner } from "../financial-semantics";
import {
  TransactionDirection as Direction,
  TRANSACTION_EVENT_GROUP_LOOKAHEAD_ROWS,
  TRANSACTION_EVENT_PAGE_LOOKAHEAD_MULTIPLIER,
  TransactionFilterType,
  TRANSACTION_LIST_PAGE_SIZE,
  TRANSACTION_LEDGER_TYPE_VALUES,
  TransactionLedgerType,
  TransactionReadStatus,
  type TransactionLedgerType as TransactionLedgerTypeValue,
} from "../ledger-constants";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";

function normalizeJoinedRow(row: Record<string, unknown>) {
  return mapTransactionRow({
    ...(row as Parameters<typeof mapTransactionRow>[0]),
    accounts: Array.isArray(row.accounts)
      ? (row.accounts[0] as { name: string; type?: string } | undefined)
      : (row.accounts as { name: string; type?: string } | null),
    categories: Array.isArray(row.categories)
      ? (row.categories[0] as { name: string } | undefined)
      : (row.categories as { name: string } | null),
    jars: Array.isArray(row.jars)
      ? (row.jars[0] as { name: string } | undefined)
      : (row.jars as { name: string } | null),
  });
}

const TX_SELECT =
  "id, account_id, type, amount, currency, transaction_date, note, category_id, jar_id, status, transfer_group_id, loan_payment_id, savings_event_kind, reverses_transaction_id, corrects_transaction_id, is_reversal, created_at, accounts(name, type), categories(name), jars(name), transaction_tag_assignments(tag_id, transaction_tags(id, name, icon_key, color_key, archived_at))";
const TX_SELECT_WITH_TAG_FILTER =
  "id, account_id, type, amount, currency, transaction_date, note, category_id, jar_id, status, transfer_group_id, loan_payment_id, savings_event_kind, reverses_transaction_id, corrects_transaction_id, is_reversal, created_at, accounts(name, type), categories(name), jars(name), transaction_tag_assignments!inner(tag_id, transaction_tags(id, name, icon_key, color_key, archived_at))";

const TRANSFER_LEDGER_TYPES = new Set<TransactionLedgerTypeValue>([
  TransactionLedgerType.TRANSFER_OUT,
  TransactionLedgerType.TRANSFER_IN,
]);

async function enrichProductEvent(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  row: LedgerTransaction,
  activity: TransactionActivity,
): Promise<TransactionActivity> {
  if (row.type !== TransactionLedgerType.LIABILITY_PAYMENT) {
    return activity;
  }

  const { data, error } = await supabase
    .from("card_payments")
    .select("transaction_id")
    .eq("transaction_id", row.id)
    .maybeSingle();
  if (error || !data) return activity;

  return {
    ...activity,
    owner: TransactionOwner.CREDIT_CARD,
    productEvent: TransactionProductEvent.CARD_PAYMENT,
  };
}

export type TransactionReadResult =
  | {
      status: typeof TransactionReadStatus.OK;
      transaction: LedgerTransaction;
    }
  | { status: typeof TransactionReadStatus.NOT_FOUND }
  | { status: typeof TransactionReadStatus.ERROR };

export async function getTransactionReadResult(
  transactionId: string,
): Promise<TransactionReadResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !transactionId) {
    return { status: TransactionReadStatus.ERROR };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("transactions")
      .select(TX_SELECT)
      .eq("household_id", gate.householdId)
      .eq("id", transactionId)
      .maybeSingle();

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.GET_TRANSACTION, {
        householdId: gate.householdId,
        transactionId,
      });
      return { status: TransactionReadStatus.ERROR };
    }
    if (!data) return { status: TransactionReadStatus.NOT_FOUND };

    return {
      status: TransactionReadStatus.OK,
      transaction: normalizeJoinedRow(data as Record<string, unknown>),
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.GET_TRANSACTION, {
      householdId: gate.householdId,
      transactionId,
    });
    return { status: TransactionReadStatus.ERROR };
  }
}

export async function getTransaction(
  transactionId: string,
): Promise<LedgerTransaction | null> {
  const result = await getTransactionReadResult(transactionId);
  return result.status === TransactionReadStatus.OK ? result.transaction : null;
}

/**
 * Loads the user-level activity for a transaction detail route. Owned-account
 * transfers are persisted as two rows, so both legs are projected together.
 */
export async function getTransactionActivity(
  transactionId: string,
): Promise<TransactionActivity | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !transactionId) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: rawRow, error } = await supabase
      .from("transactions")
      .select(TX_SELECT)
      .eq("household_id", gate.householdId)
      .eq("id", transactionId)
      .maybeSingle();

    if (error || !rawRow) {
      if (error) {
        logLedgerFailure(error, LEDGER_OPERATION.GET_TRANSACTION, {
          householdId: gate.householdId,
          transactionId,
        });
      }
      return null;
    }

    const row = normalizeJoinedRow(rawRow as Record<string, unknown>);
    if (row.loanPaymentId) {
      const { data: rawPaymentRows, error: paymentGroupError } = await supabase
        .from("transactions")
        .select(TX_SELECT)
        .eq("household_id", gate.householdId)
        .eq("loan_payment_id", row.loanPaymentId);
      if (paymentGroupError) {
        logLedgerFailure(paymentGroupError, LEDGER_OPERATION.GET_TRANSACTION, {
          householdId: gate.householdId,
          transactionId,
        });
        return null;
      }
      return (
        createTransactionActivities(
          (rawPaymentRows ?? []).map((paymentRow) =>
            normalizeJoinedRow(paymentRow as Record<string, unknown>),
          ),
        ).find((activity) => activity.loanPaymentId === row.loanPaymentId) ??
        null
      );
    }
    if (!row.transferGroupId || !TRANSFER_LEDGER_TYPES.has(row.type)) {
      const activity = createTransactionActivities([row])[0];
      return activity ? enrichProductEvent(supabase, row, activity) : null;
    }

    const { data: rawGroup, error: groupError } = await supabase
      .from("transactions")
      .select(TX_SELECT)
      .eq("household_id", gate.householdId)
      .eq("transfer_group_id", row.transferGroupId)
      .in("type", [
        TransactionLedgerType.TRANSFER_OUT,
        TransactionLedgerType.TRANSFER_IN,
      ]);

    if (groupError) {
      logLedgerFailure(groupError, LEDGER_OPERATION.GET_TRANSACTION, {
        householdId: gate.householdId,
        transactionId,
        transferGroupId: row.transferGroupId,
      });
      return null;
    }

    return (
      createTransactionActivities(
        (rawGroup ?? []).map((groupRow) =>
          normalizeJoinedRow(groupRow as Record<string, unknown>),
        ),
      ).find((activity) => activity.transferGroupId === row.transferGroupId) ??
      null
    );
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.GET_TRANSACTION, {
      householdId: gate.householdId,
      transactionId,
    });
    return null;
  }
}

export type ListTransactionsFilter = {
  q?: string;
  tagIds?: readonly string[];
  type?:
    | TransactionDirection
    | typeof TransactionFilterType.ALL
    | typeof TransactionFilterType.TRANSFER
    | typeof TransactionFilterType.INVESTMENT
    | typeof TransactionFilterType.SAVINGS
    | typeof TransactionFilterType.DEBT;
  limit?: number | null;
};

export type ListTransactionEventsFilter = {
  type: TransactionFilterType;
  tagIds?: readonly string[];
  cursor?: string;
  limit?: number;
};

export type ListTransactionEventsResult = {
  activities: TransactionActivity[];
  nextCursor: string | null;
  hasMore: boolean;
};

type TransactionEventCursor = {
  effectiveDate: string;
  representativeCreatedAt: string;
  id: string;
  anchorId: string;
};

function encodeCursor(activity: TransactionActivity): string {
  return Buffer.from(
    JSON.stringify({
      effectiveDate: activity.effectiveDate,
      representativeCreatedAt: activity.representativeCreatedAt,
      id: activity.id,
      anchorId: activity.paginationAnchorId,
    }),
  ).toString("base64url");
}

function decodeCursor(value?: string): TransactionEventCursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (
      typeof parsed?.effectiveDate !== "string" ||
      typeof parsed?.representativeCreatedAt !== "string" ||
      typeof parsed?.id !== "string" ||
      (parsed?.anchorId != null && typeof parsed.anchorId !== "string")
    ) {
      return null;
    }
    return {
      effectiveDate: parsed.effectiveDate,
      representativeCreatedAt: parsed.representativeCreatedAt,
      id: parsed.id,
      anchorId:
        typeof parsed.anchorId === "string" ? parsed.anchorId : parsed.id,
    };
  } catch {
    return null;
  }
}

function isAfterCursor(
  activity: TransactionActivity,
  cursor: TransactionEventCursor | null,
) {
  if (!cursor) return true;
  const byDate = activity.effectiveDate.localeCompare(cursor.effectiveDate);
  if (byDate !== 0) return byDate < 0;
  const byCreatedAt = activity.representativeCreatedAt.localeCompare(
    cursor.representativeCreatedAt,
  );
  if (byCreatedAt !== 0) return byCreatedAt < 0;
  return activity.paginationAnchorId.localeCompare(cursor.anchorId) < 0;
}

function cursorPredicate(cursor: TransactionEventCursor) {
  return [
    `transaction_date.lt.${cursor.effectiveDate}`,
    `and(transaction_date.eq.${cursor.effectiveDate},created_at.lt.${cursor.representativeCreatedAt})`,
    `and(transaction_date.eq.${cursor.effectiveDate},created_at.eq.${cursor.representativeCreatedAt},id.lt.${cursor.anchorId})`,
  ].join(",");
}

async function listTransactionEventRows(
  filter: ListTransactionEventsFilter,
  limit: number,
  cursor: TransactionEventCursor | null,
): Promise<LedgerTransaction[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("transactions")
      .select(
        filter.tagIds && filter.tagIds.length > 0
          ? TX_SELECT_WITH_TAG_FILTER
          : TX_SELECT,
      )
      .eq("household_id", gate.householdId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (filter.type === TransactionFilterType.INCOME) {
      query = query.in("type", [TransactionLedgerType.INCOME]);
    }
    if (filter.type === TransactionFilterType.EXPENSE) {
      query = query.in("type", [
        TransactionLedgerType.EXPENSE,
        TransactionLedgerType.INVESTMENT_FEE,
        TransactionLedgerType.LOAN_INTEREST,
        TransactionLedgerType.LIABILITY_PAYMENT,
      ]);
    }
    if (filter.type === TransactionFilterType.TRANSFER) {
      query = query.in("type", [
        TransactionLedgerType.TRANSFER_OUT,
        TransactionLedgerType.TRANSFER_IN,
      ]);
    }
    if (filter.type === TransactionFilterType.INVESTMENT) {
      query = query.in(
        "type",
        TRANSACTION_LEDGER_TYPE_VALUES.filter((value) =>
          value.startsWith(TransactionFilterType.INVESTMENT),
        ),
      );
    }
    if (filter.type === TransactionFilterType.SAVINGS) {
      query = query.like("savings_event_kind", "SAVINGS_%");
    }
    if (filter.type === TransactionFilterType.DEBT) {
      query = query.in("type", [
        TransactionLedgerType.DEBT_BORROWING,
        TransactionLedgerType.DEBT_LENDING,
        TransactionLedgerType.DEBT_RECEIVABLE_PAYMENT,
      ]);
    }
    if (filter.tagIds && filter.tagIds.length > 0) {
      query = query.in("transaction_tag_assignments.tag_id", filter.tagIds);
    }
    if (cursor) query = query.or(cursorPredicate(cursor));

    const { data, error } = await query;
    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.LIST_TRANSACTIONS, {
        householdId: gate.householdId,
      });
      return null;
    }
    return (data ?? []).map((row) =>
      normalizeJoinedRow(row as Record<string, unknown>),
    );
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_TRANSACTIONS, {
      householdId: gate.householdId,
    });
    return null;
  }
}

export async function listTransactions(
  filter: ListTransactionsFilter = {},
): Promise<LedgerTransaction[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("transactions")
      .select(TX_SELECT)
      .eq("household_id", gate.householdId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    if (filter.limit !== null) {
      query = query.limit(filter.limit ?? 100);
    }

    if (filter.type === Direction.INCOME || filter.type === Direction.EXPENSE) {
      query = query.eq("type", filter.type);
    }
    if (filter.type === TransactionFilterType.TRANSFER) {
      query = query.in("type", [
        TransactionLedgerType.TRANSFER_OUT,
        TransactionLedgerType.TRANSFER_IN,
      ]);
    }
    if (filter.type === TransactionFilterType.INVESTMENT) {
      query = query.in(
        "type",
        TRANSACTION_LEDGER_TYPE_VALUES.filter((type) =>
          type.startsWith(TransactionFilterType.INVESTMENT),
        ),
      );
    }
    if (filter.type === TransactionFilterType.SAVINGS) {
      query = query.like("savings_event_kind", "SAVINGS_%");
    }
    if (filter.type === TransactionFilterType.DEBT) {
      query = query.in("type", [
        TransactionLedgerType.DEBT_BORROWING,
        TransactionLedgerType.DEBT_LENDING,
        TransactionLedgerType.DEBT_RECEIVABLE_PAYMENT,
      ]);
    }

    const { data, error } = await query;
    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.LIST_TRANSACTIONS, {
        householdId: gate.householdId,
      });
      return null;
    }

    const rows = (data ?? []).map((row) =>
      normalizeJoinedRow(row as Record<string, unknown>),
    );

    const q = filter.q?.trim().toLowerCase();
    return rows.filter((tx) => {
      const matchesQuery = [
        tx.note,
        tx.categoryName,
        tx.accountName,
        tx.jarName,
        ...tx.tags.map((tag) => tag.name),
        tx.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        (!q || matchesQuery.includes(q)) &&
        transactionMatchesTagFilter(tx.tags, filter.tagIds)
      );
    });
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_TRANSACTIONS, {
      householdId: gate.householdId,
    });
    return null;
  }
}

/** Projects a bounded raw-row lookahead into stable user-level activities. */
export async function listTransactionEvents(
  filter: ListTransactionEventsFilter,
): Promise<ListTransactionEventsResult | null> {
  const pageSize = filter.limit ?? TRANSACTION_LIST_PAGE_SIZE;
  const rawLimit = Math.max(
    pageSize * TRANSACTION_EVENT_PAGE_LOOKAHEAD_MULTIPLIER,
    pageSize + TRANSACTION_EVENT_GROUP_LOOKAHEAD_ROWS,
  );
  const cursor = decodeCursor(filter.cursor);
  const rows = await listTransactionEventRows(filter, rawLimit, cursor);
  if (!rows) return null;

  const activities = createTransactionActivities(rows)
    .filter((activity) =>
      transactionActivityMatchesFilter(activity, filter.type),
    )
    .filter((activity) => isAfterCursor(activity, cursor));
  const page = activities.slice(0, pageSize);
  const last = page.at(-1);

  return {
    activities: page,
    hasMore: activities.length > page.length,
    nextCursor: last ? encodeCursor(last) : null,
  };
}
