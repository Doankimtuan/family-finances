import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import {
  InboxItemStatus,
  InboxSourceType,
  INBOX_ARCHIVED_STATUS_VALUES,
  mapInboxKind,
  mapInboxStatus,
  toReviewItemType,
  MaturityAckAction,
  SavingsMaturityAckAction,
  EarlyWithdrawalAckAction,
  EmiAckAction,
  SAVINGS_MATURITY_ACK_ACTION_VALUES,
  EARLY_WITHDRAWAL_ACK_ACTION_VALUES,
} from "./inbox-constants";
import { instantiateTypedReviewItem } from "./review-item-schemas";
import { shouldAutoResolveInboxItem } from "./inbox-resolution-policy";
import { resolveInboxDisplayTitle } from "./inbox-display";
import type { InboxReviewItem } from "./inbox-types";

export {
  InboxItemKind,
  InboxItemStatus,
  InboxSourceType,
  INBOX_SOURCE_TYPE_VALUES,
  INBOX_ITEM_KIND_VALUES,
  INBOX_ITEM_STATUS_VALUES,
  INBOX_ARCHIVED_STATUS_VALUES,
  InboxQueueTab,
  InboxReceiptKind,
  INBOX_RECEIPT_KIND_VALUES,
  INBOX_RECEIPT_QUERY,
  INBOX_TAB_QUERY,
  ReviewItemType,
  REVIEW_ITEM_TYPE_VALUES,
  AUTO_RESOLVE_CONFIDENCE_THRESHOLD,
  MERCHANT_CONFIRMATION_THRESHOLD,
  PAYMENT_REMINDER_EXPIRE_DAYS,
  MaturityAckAction,
  SavingsMaturityAckAction,
  EarlyWithdrawalAckAction,
  EmiAckAction,
  SAVINGS_MATURITY_ACK_ACTION_VALUES,
  EARLY_WITHDRAWAL_ACK_ACTION_VALUES,
  isJarResolvableKind,
  isGuidedKind,
  isArchivedStatus,
  mapInboxKind,
  mapInboxStatus,
  toReviewItemType,
  reviewItemTypeToKind,
} from "./inbox-constants";
export type {
  InboxAckAction,
  InboxSourceType as InboxSourceTypeValue,
  ReviewItemType as ReviewItemTypeValue,
} from "./inbox-constants";
export type { InboxReviewItem } from "./inbox-types";
export {
  typedReviewItemSchema,
  parseTypedReviewItem,
  instantiateTypedReviewItem,
  isSpecReviewItemType,
} from "./review-item-schemas";
export {
  confidenceFromConfirmations,
  meetsAutoResolveConfidence,
  shouldAutoResolveInboxItem,
  shouldCancelMaturityCascade,
  isPaymentReminderExpired,
  paymentReminderExpiresAt,
} from "./inbox-resolution-policy";
export {
  InboxGenericTitle,
  isGenericInboxTitle,
  resolveInboxDisplayTitle,
} from "./inbox-display";

const INBOX_SELECT =
  "id, kind, status, title, amount, currency, source_id, source_type, created_at, expires_at, auto_resolved, confidence_score, suggested_jar_id, suggested_category_id, context_json, assigned_to_user_id";

function mapInboxRow(
  row: {
    id: string;
    kind: string;
    status?: string | null;
    title: string;
    amount: number | string;
    currency: string | null;
    source_id: string;
    source_type?: string | null;
    created_at: string;
    expires_at?: string | null;
    auto_resolved?: boolean | null;
    confidence_score?: number | string | null;
    suggested_jar_id?: string | null;
    suggested_category_id?: string | null;
    context_json?: Record<string, unknown> | null;
    assigned_to_user_id?: string | null;
  },
  txDetails?: {
    note: string | null;
    categoryName: string | null;
    accountName: string | null;
  },
): InboxReviewItem {
  const context = row.context_json ?? null;
  const intentRaw = context?.intent_note;
  const executedRaw = context?.executed_by_user_id;
  const assignedFromContext = context?.assigned_to_user_id;
  const dueRaw = context?.due_at;
  const merchantRaw = context?.merchant_key;
  const confirmRaw = context?.confirmation_count;
  const cascadeRaw = context?.cascade_day;
  const kind = mapInboxKind(row.kind);
  const status = mapInboxStatus(row.status);
  const suggestedJarId = row.suggested_jar_id ?? null;
  const suggestedCategoryId = row.suggested_category_id ?? null;
  const intentNote = typeof intentRaw === "string" ? intentRaw : null;
  const executedByUserId = typeof executedRaw === "string" ? executedRaw : null;
  const dueAt = typeof dueRaw === "string" ? dueRaw : null;
  const expiresAt = row.expires_at ?? null;
  const confidenceScore =
    row.confidence_score == null ? null : Number(row.confidence_score);
  const cascadeDay =
    cascadeRaw === 30 || cascadeRaw === 14 || cascadeRaw === 7
      ? cascadeRaw
      : undefined;

  const contextCategory =
    typeof context?.category_name === "string" ? context.category_name : null;
  const contextAccount =
    typeof context?.account_name === "string" ? context.account_name : null;
  const contextNote = typeof context?.note === "string" ? context.note : null;

  const note = txDetails?.note ?? contextNote;
  const categoryName = txDetails?.categoryName ?? contextCategory;
  const accountName = txDetails?.accountName ?? contextAccount;

  const typed = instantiateTypedReviewItem({
    kind,
    sourceId: row.source_id,
    intentNote,
    suggestedJarId,
    suggestedCategoryId,
    dueAt,
    expiresAt,
    merchantKey: typeof merchantRaw === "string" ? merchantRaw : null,
    confirmationCount: typeof confirmRaw === "number" ? confirmRaw : undefined,
    cascadeDay,
    planMovementId:
      typeof context?.plan_movement_id === "string"
        ? context.plan_movement_id
        : undefined,
    sourceJarId:
      typeof context?.source_jar_id === "string"
        ? context.source_jar_id
        : undefined,
    targetJarId:
      typeof context?.target_jar_id === "string"
        ? context.target_jar_id
        : undefined,
    executedByUserId,
    contextJson: context,
  });

  const displayTitle = resolveInboxDisplayTitle({
    kind,
    storedTitle: row.title,
    note,
    categoryName,
  });

  return {
    id: row.id,
    kind,
    type: toReviewItemType(kind),
    status,
    title: row.title,
    displayTitle: displayTitle || row.title,
    amount:
      typeof row.amount === "string" ? Number(row.amount) : Number(row.amount),
    currency: (row.currency ?? DEFAULT_CURRENCY).toUpperCase(),
    sourceId: row.source_id,
    sourceType: [
      InboxSourceType.TRANSACTION,
      InboxSourceType.GUIDED,
      InboxSourceType.PLAN_MOVEMENT,
    ].includes(row.source_type as InboxSourceType)
      ? (row.source_type as InboxSourceType)
      : null,
    createdAt: row.created_at,
    expiresAt,
    autoResolved: Boolean(row.auto_resolved),
    confidenceScore:
      confidenceScore != null && Number.isFinite(confidenceScore)
        ? confidenceScore
        : null,
    suggestedJarId,
    suggestedCategoryId,
    note,
    categoryName,
    accountName,
    typed,
    intentNote,
    executedByUserId,
    assignedToUserId:
      row.assigned_to_user_id ??
      (typeof assignedFromContext === "string" ? assignedFromContext : null),
  };
}

async function enrichWithTransactionDetails(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  rows: Array<{
    id: string;
    kind: string;
    status?: string | null;
    title: string;
    amount: number | string;
    currency: string | null;
    source_id: string;
    source_type?: string | null;
    created_at: string;
    expires_at?: string | null;
    auto_resolved?: boolean | null;
    confidence_score?: number | string | null;
    suggested_jar_id?: string | null;
    suggested_category_id?: string | null;
    context_json?: Record<string, unknown> | null;
    assigned_to_user_id?: string | null;
  }>,
): Promise<InboxReviewItem[]> {
  const txIds = rows
    .filter((row) => row.source_type === InboxSourceType.TRANSACTION)
    .map((row) => row.source_id);

  const detailsById = new Map<
    string,
    {
      note: string | null;
      categoryName: string | null;
      accountName: string | null;
    }
  >();

  if (txIds.length > 0) {
    const { data: txs } = await supabase
      .from("transactions")
      .select("id, note, categories(name), accounts(name)")
      .in("id", txIds);

    for (const tx of txs ?? []) {
      const categories = tx.categories as
        { name?: string } | { name?: string }[] | null;
      const accounts = tx.accounts as
        { name?: string } | { name?: string }[] | null;
      const categoryName = Array.isArray(categories)
        ? (categories[0]?.name ?? null)
        : (categories?.name ?? null);
      const accountName = Array.isArray(accounts)
        ? (accounts[0]?.name ?? null)
        : (accounts?.name ?? null);
      detailsById.set(tx.id as string, {
        note: (tx.note as string | null) ?? null,
        categoryName,
        accountName,
      });
    }
  }

  return rows.map((row) => mapInboxRow(row, detailsById.get(row.source_id)));
}

export async function listOpenInboxItems(): Promise<InboxReviewItem[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

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
      return null;
    }

    return enrichWithTransactionDetails(supabase, data ?? []);
  } catch {
    return null;
  }
}

export async function listArchivedInboxItems(): Promise<
  InboxReviewItem[] | null
> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

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
      return null;
    }

    return enrichWithTransactionDetails(supabase, data ?? []);
  } catch {
    return null;
  }
}

export async function getInboxItem(
  inboxItemId: string,
): Promise<InboxReviewItem | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

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
      return null;
    }

    const [item] = await enrichWithTransactionDetails(supabase, [data]);
    return item ?? null;
  } catch {
    return null;
  }
}

export const resolveInboxItemInputSchema = z.object({
  inboxItemId: z.string().uuid(),
  jarId: z.string().uuid(),
});

export type ResolveInboxItemInput = z.infer<typeof resolveInboxItemInputSchema>;

export type InboxMutationResult =
  | { ok: true; status: string; cascadeCancelledCount?: number }
  | { ok: false; code: ProductActionErrorCode };

export type ResolveInboxItemResult = InboxMutationResult;

export async function resolveInboxItemToJar(
  raw: ResolveInboxItemInput,
): Promise<ResolveInboxItemResult> {
  const parsed = resolveInboxItemInputSchema.safeParse(raw);
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
    const { data, error } = await supabase.rpc("resolve_inbox_item_to_jar", {
      p_inbox_item_id: parsed.data.inboxItemId,
      p_jar_id: parsed.data.jarId,
    });

    if (error || !data) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const payload = data as { status?: string };
    return { ok: true, status: payload.status ?? InboxItemStatus.RESOLVED };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export const dismissInboxItemInputSchema = z.object({
  inboxItemId: z.string().uuid(),
});

export type DismissInboxItemInput = z.infer<typeof dismissInboxItemInputSchema>;

export async function dismissInboxItem(
  raw: DismissInboxItemInput,
): Promise<InboxMutationResult> {
  const parsed = dismissInboxItemInputSchema.safeParse(raw);
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
    const { data, error } = await supabase.rpc("dismiss_inbox_item", {
      p_inbox_item_id: parsed.data.inboxItemId,
    });

    if (error || !data) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const payload = data as { status?: string };
    return { ok: true, status: payload.status ?? InboxItemStatus.DISMISSED };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

const ACK_ACTION_VALUES = [
  ...SAVINGS_MATURITY_ACK_ACTION_VALUES,
  ...EARLY_WITHDRAWAL_ACK_ACTION_VALUES,
  EmiAckAction.CELEBRATE,
  EmiAckAction.LATER,
  MaturityAckAction.RENEW,
  MaturityAckAction.SWITCH,
  MaturityAckAction.WITHDRAW,
  SavingsMaturityAckAction.CONFIRM_CONFIGURED,
  EarlyWithdrawalAckAction.CONFIRM,
] as const;

const ACK_ACTION_ENUM = [...new Set(ACK_ACTION_VALUES)] as unknown as [
  string,
  ...string[],
];

export const acknowledgeInboxItemInputSchema = z.object({
  inboxItemId: z.string().uuid(),
  action: z.enum(ACK_ACTION_ENUM),
});

export type AcknowledgeInboxItemInput = z.infer<
  typeof acknowledgeInboxItemInputSchema
>;

export async function acknowledgeInboxItem(
  raw: AcknowledgeInboxItemInput,
): Promise<InboxMutationResult> {
  const parsed = acknowledgeInboxItemInputSchema.safeParse(raw);
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
    const { data, error } = await supabase.rpc("acknowledge_inbox_item", {
      p_inbox_item_id: parsed.data.inboxItemId,
      p_action: parsed.data.action,
    });

    if (error || !data) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const payload = data as {
      status?: string;
      cascade_cancelled_count?: number;
    };
    return {
      ok: true,
      status: payload.status ?? InboxItemStatus.ACKNOWLEDGED,
      cascadeCancelledCount: Number(payload.cascade_cancelled_count ?? 0),
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export const autoResolveInboxItemInputSchema = z.object({
  inboxItemId: z.string().uuid(),
});

export type AutoResolveInboxItemInput = z.infer<
  typeof autoResolveInboxItemInputSchema
>;

export async function autoResolveInboxItem(
  raw: AutoResolveInboxItemInput,
): Promise<InboxMutationResult> {
  const parsed = autoResolveInboxItemInputSchema.safeParse(raw);
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
    const item = await getInboxItem(parsed.data.inboxItemId);
    if (!item) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    if (
      !shouldAutoResolveInboxItem({
        kind: item.kind,
        confidenceScore: item.confidenceScore,
        suggestedJarId: item.suggestedJarId,
      })
    ) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("auto_resolve_inbox_item", {
      p_inbox_item_id: parsed.data.inboxItemId,
    });

    if (error || !data) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const payload = data as { status?: string };
    return {
      ok: true,
      status: payload.status ?? InboxItemStatus.AUTO_RESOLVED,
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export type InboxStalenessWorkerResult =
  | { ok: true; expiredCount: number }
  | { ok: false; code: ProductActionErrorCode };

/**
 * Hourly-capable staleness sweep for the active household (BR-15).
 */
export async function runInboxStalenessWorker(): Promise<InboxStalenessWorkerResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("run_inbox_staleness_worker");

    if (error || !data || typeof data !== "object") {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const payload = data as { expired_count?: number };
    return {
      ok: true,
      expiredCount: Number(payload.expired_count ?? 0),
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
