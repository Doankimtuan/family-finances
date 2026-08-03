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
  InboxItemKind,
  InboxItemStatus,
  type InboxItemKind as InboxItemKindValue,
} from "./inbox-constants";

export { InboxItemKind, InboxItemStatus } from "./inbox-constants";

export type InboxReviewItem = {
  id: string;
  kind: InboxItemKindValue;
  title: string;
  amount: number;
  currency: string;
  sourceId: string;
  createdAt: string;
};

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

    return (data ?? []).map((row) => ({
      id: row.id,
      kind:
        row.kind === InboxItemKind.INCOME_SUGGEST
          ? InboxItemKind.INCOME_SUGGEST
          : InboxItemKind.UNMAPPED_EXPENSE,
      title: row.title,
      amount:
        typeof row.amount === "string"
          ? Number(row.amount)
          : Number(row.amount),
      currency: (row.currency ?? DEFAULT_CURRENCY).toUpperCase(),
      sourceId: row.source_id,
      createdAt: row.created_at,
    }));
  } catch {
    return null;
  }
}

export const resolveInboxItemInputSchema = z.object({
  inboxItemId: z.string().uuid(),
  jarId: z.string().uuid(),
});

export type ResolveInboxItemInput = z.infer<typeof resolveInboxItemInputSchema>;

export type ResolveInboxItemResult =
  { ok: true; status: string } | { ok: false; code: ProductActionErrorCode };

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
