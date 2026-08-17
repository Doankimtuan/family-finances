import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import {
  InboxSourceType,
  INBOX_SOURCE_TYPE_VALUES,
  mapInboxKind,
  mapInboxStatus,
} from "../inbox-constants";
import { instantiateTypedReviewItem } from "../review-item-schemas";
import { resolveInboxDisplayTitle } from "../inbox-display";
import type { InboxReviewItem } from "../inbox-types";

export type InboxItemRow = {
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
};

export type InboxTransactionDetails = {
  note: string | null;
  categoryName: string | null;
  accountName: string | null;
};

const INBOX_SOURCE_TYPES = new Set<string>(INBOX_SOURCE_TYPE_VALUES);

function isInboxSourceType(
  value: string | null | undefined,
): value is InboxSourceType {
  return value != null && INBOX_SOURCE_TYPES.has(value);
}

/**
 * Map a persisted row to the canonical InboxReviewItem. Legacy kinds without a
 * canonical contract (mapInboxKind → null) must not silently re-enter the
 * active queue — the caller filters them out (Prompt 13A).
 */
export function mapInboxRow(
  row: InboxItemRow,
  txDetails?: InboxTransactionDetails,
): InboxReviewItem | null {
  const kind = mapInboxKind(row.kind);
  const status = mapInboxStatus(row.status);
  if (!kind || !status) return null;

  const context = row.context_json ?? null;
  const intentRaw = context?.intent_note;
  const executedRaw = context?.executed_by_user_id;
  const assignedFromContext = context?.assigned_to_user_id;
  const merchantRaw = context?.merchant_key;
  const confirmRaw = context?.confirmation_count;
  const suggestedJarId = row.suggested_jar_id ?? null;
  const suggestedCategoryId = row.suggested_category_id ?? null;
  const intentNote = typeof intentRaw === "string" ? intentRaw : null;
  const executedByUserId = typeof executedRaw === "string" ? executedRaw : null;
  const expiresAt = row.expires_at ?? null;
  const confidenceScore =
    row.confidence_score == null ? null : Number(row.confidence_score);

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
    merchantKey: typeof merchantRaw === "string" ? merchantRaw : null,
    confirmationCount: typeof confirmRaw === "number" ? confirmRaw : undefined,
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
    storedTitle: row.title,
    note,
    categoryName,
  });

  return {
    id: row.id,
    kind,
    status,
    title: row.title,
    displayTitle: displayTitle || row.title,
    amount: Number(row.amount),
    currency: (row.currency ?? DEFAULT_CURRENCY).toUpperCase(),
    sourceId: row.source_id,
    sourceType: isInboxSourceType(row.source_type) ? row.source_type : null,
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
