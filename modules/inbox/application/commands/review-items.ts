import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  EarlyWithdrawalAckAction,
  EmiAckAction,
  InboxItemStatus,
  MaturityAckAction,
  SavingsMaturityAckAction,
  SAVINGS_MATURITY_ACK_ACTION_VALUES,
  EARLY_WITHDRAWAL_ACK_ACTION_VALUES,
} from "../inbox-constants";
import { shouldAutoResolveInboxItem } from "../inbox-resolution-policy";
import { getInboxItem } from "../queries/review-items";

const INBOX_COMMAND_ERROR_CONTEXT = "[inbox review-item command]";

export const resolveInboxItemInputSchema = z.object({
  inboxItemId: z.string().uuid(),
  jarId: z.string().uuid(),
});

export type ResolveInboxItemInput = z.infer<typeof resolveInboxItemInputSchema>;

export type InboxMutationResult =
  | { ok: true; status: string; cascadeCancelledCount?: number }
  | { ok: false; code: ProductActionErrorCode };

export type ResolveInboxItemResult = InboxMutationResult;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mutationResult(
  data: unknown,
  fallbackStatus: InboxItemStatus,
  includeCascadeCount = false,
): {
  status: string;
  cascadeCancelledCount?: number;
} {
  const payload = isRecord(data) ? data : {};
  const cascadeCount =
    typeof payload.cascade_cancelled_count === "number" ||
    typeof payload.cascade_cancelled_count === "string"
      ? Number(payload.cascade_cancelled_count)
      : 0;

  return {
    status:
      typeof payload.status === "string" ? payload.status : fallbackStatus,
    ...(includeCascadeCount ? { cascadeCancelledCount: cascadeCount } : {}),
  };
}

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
      if (error) console.error(INBOX_COMMAND_ERROR_CONTEXT, error);
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, ...mutationResult(data, InboxItemStatus.RESOLVED) };
  } catch (error) {
    console.error(INBOX_COMMAND_ERROR_CONTEXT, error);
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
      if (error) console.error(INBOX_COMMAND_ERROR_CONTEXT, error);
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, ...mutationResult(data, InboxItemStatus.DISMISSED) };
  } catch (error) {
    console.error(INBOX_COMMAND_ERROR_CONTEXT, error);
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
const ACK_ACTION_SET: ReadonlySet<string> = new Set(ACK_ACTION_VALUES);

export const acknowledgeInboxItemInputSchema = z.object({
  inboxItemId: z.string().uuid(),
  action: z.string().refine((value) => ACK_ACTION_SET.has(value)),
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
      if (error) console.error(INBOX_COMMAND_ERROR_CONTEXT, error);
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return {
      ok: true,
      ...mutationResult(data, InboxItemStatus.ACKNOWLEDGED, true),
    };
  } catch (error) {
    console.error(INBOX_COMMAND_ERROR_CONTEXT, error);
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
      if (error) console.error(INBOX_COMMAND_ERROR_CONTEXT, error);
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return {
      ok: true,
      ...mutationResult(data, InboxItemStatus.AUTO_RESOLVED),
    };
  } catch (error) {
    console.error(INBOX_COMMAND_ERROR_CONTEXT, error);
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
