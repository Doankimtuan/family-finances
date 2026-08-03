import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { InboxItemStatus, mapInboxKind } from "./inbox-constants";
import type { InboxReviewItem } from "./inbox-types";

export {
  InboxItemKind,
  InboxItemStatus,
  MaturityAckAction,
  EmiAckAction,
  isJarResolvableKind,
  isGuidedKind,
  mapInboxKind,
} from "./inbox-constants";
export type { InboxAckAction } from "./inbox-constants";
export type { InboxReviewItem } from "./inbox-types";

export async function listOpenInboxItems(): Promise<InboxReviewItem[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("inbox_items")
      .select("id, kind, title, amount, currency, source_id, created_at")
      .eq("household_id", gate.householdId)
      .eq("status", InboxItemStatus.PENDING)
      .order("created_at", { ascending: false });

    if (error) {
      return null;
    }

    return (data ?? []).map(mapInboxRow);
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
      .select("id, kind, title, amount, currency, source_id, created_at")
      .eq("household_id", gate.householdId)
      .eq("id", inboxItemId)
      .eq("status", InboxItemStatus.PENDING)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapInboxRow(data);
  } catch {
    return null;
  }
}

function mapInboxRow(row: {
  id: string;
  kind: string;
  title: string;
  amount: number | string;
  currency: string | null;
  source_id: string;
  created_at: string;
}): InboxReviewItem {
  return {
    id: row.id,
    kind: mapInboxKind(row.kind),
    title: row.title,
    amount:
      typeof row.amount === "string" ? Number(row.amount) : Number(row.amount),
    currency: (row.currency ?? DEFAULT_CURRENCY).toUpperCase(),
    sourceId: row.source_id,
    createdAt: row.created_at,
  };
}

export const resolveInboxItemInputSchema = z.object({
  inboxItemId: z.string().uuid(),
  jarId: z.string().uuid(),
});

export type ResolveInboxItemInput = z.infer<typeof resolveInboxItemInputSchema>;

export type InboxMutationResult =
  { ok: true; status: string } | { ok: false; code: ProductActionErrorCode };

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

export const acknowledgeInboxItemInputSchema = z.object({
  inboxItemId: z.string().uuid(),
  action: z.enum(["renew", "switch", "withdraw", "celebrate", "later"]),
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

    const payload = data as { status?: string };
    return {
      ok: true,
      status: payload.status ?? InboxItemStatus.ACKNOWLEDGED,
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
