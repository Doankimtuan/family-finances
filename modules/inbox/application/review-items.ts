import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";

export type InboxItemKind = "unmapped_expense" | "income_suggest";

export type InboxReviewItem = {
  id: string;
  kind: InboxItemKind;
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
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      return null;
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      kind:
        row.kind === "income_suggest" ? "income_suggest" : "unmapped_expense",
      title: row.title,
      amount:
        typeof row.amount === "string"
          ? Number(row.amount)
          : Number(row.amount),
      currency: (row.currency ?? "VND").toUpperCase(),
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
  | { ok: true; status: string }
  | {
      ok: false;
      code: "unauthenticated" | "no_membership" | "invalid" | "unknown";
    };

export async function resolveInboxItemToJar(
  raw: ResolveInboxItemInput,
): Promise<ResolveInboxItemResult> {
  const parsed = resolveInboxItemInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "invalid" };
  }

  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code:
        gate.reason === "unauthenticated" ? "unauthenticated" : "no_membership",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("resolve_inbox_item_to_jar", {
      p_inbox_item_id: parsed.data.inboxItemId,
      p_jar_id: parsed.data.jarId,
    });

    if (error || !data) {
      return { ok: false, code: "unknown" };
    }

    const payload = data as { status?: string };
    return { ok: true, status: payload.status ?? "resolved" };
  } catch {
    return { ok: false, code: "unknown" };
  }
}
