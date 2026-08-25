import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
} from "@/modules/tenancy/application/product-action-error";
import type { Result } from "@/modules/shared-kernel/application/result";
import {
  EmiAckAction,
  InboxItemKind,
  InboxItemStatus,
  INBOX_ITEM_STATUS_VALUES,
  INBOX_OPERATION,
  INBOX_RPC,
  SavingsMaturityAckAction,
  SAVINGS_MATURITY_ACK_ACTION_VALUES,
  EARLY_WITHDRAWAL_ACK_ACTION_VALUES,
} from "../inbox-constants";
import { kindAckActions } from "../review-item-schemas";
import {
  classifyInboxRpcError,
  logInboxFailure,
  type InboxCommandErrorCode,
} from "../inbox-error";

export const resolveInboxItemInputSchema = z.object({
  inboxItemId: z.string().uuid(),
  jarId: z.string().uuid(),
});

export type ResolveInboxItemInput = z.infer<typeof resolveInboxItemInputSchema>;

type InboxMutationSuccess = {
  status: InboxItemStatus;
  cascadeCancelledCount?: number;
};

export type InboxMutationResult = Result<
  InboxMutationSuccess,
  InboxCommandErrorCode
>;

export type InboxReadStateResult = Result<
  { readAt: string | null },
  InboxCommandErrorCode
>;

const inboxReadStateInputSchema = z.object({ inboxItemId: z.string().uuid() });

export type ResolveInboxItemResult = InboxMutationResult;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const INBOX_ITEM_STATUS_SET: ReadonlySet<string> = new Set(
  INBOX_ITEM_STATUS_VALUES,
);

function isInboxItemStatus(value: unknown): value is InboxItemStatus {
  return typeof value === "string" && INBOX_ITEM_STATUS_SET.has(value);
}

function mutationResult(
  data: unknown,
  fallbackStatus: InboxItemStatus,
  includeCascadeCount = false,
): {
  status: InboxItemStatus;
  cascadeCancelledCount?: number;
} {
  const payload = isRecord(data) ? data : {};
  const cascadeCount =
    typeof payload.cascade_cancelled_count === "number" ||
    typeof payload.cascade_cancelled_count === "string"
      ? Number(payload.cascade_cancelled_count)
      : 0;

  return {
    status: isInboxItemStatus(payload.status) ? payload.status : fallbackStatus,
    ...(includeCascadeCount ? { cascadeCancelledCount: cascadeCount } : {}),
  };
}

function mapRpcFailure(
  error: unknown,
  operation: (typeof INBOX_OPERATION)[keyof typeof INBOX_OPERATION],
  context: {
    householdId: string;
    inboxItemId: string;
    action?: string;
    responseInvalid?: boolean;
  },
): { ok: false; code: InboxCommandErrorCode } {
  const code = classifyInboxRpcError(error);
  if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
    logInboxFailure(error, operation, context);
  }
  return { ok: false, code };
}

function mapUnexpectedFailure(
  error: unknown,
  operation: (typeof INBOX_OPERATION)[keyof typeof INBOX_OPERATION],
  context: {
    householdId: string;
    inboxItemId: string;
    action?: string;
    responseInvalid?: boolean;
  },
): { ok: false; code: InboxCommandErrorCode } {
  logInboxFailure(error, operation, context);
  return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
}

async function setInboxReadState(
  inboxItemId: string,
  readAt: string | null,
  operation: (typeof INBOX_OPERATION)[keyof typeof INBOX_OPERATION],
): Promise<InboxReadStateResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("inbox_items")
      .update({ read_at: readAt })
      .eq("household_id", gate.householdId)
      .eq("id", inboxItemId);
    if (error) {
      return mapUnexpectedFailure(error, operation, {
        householdId: gate.householdId,
        inboxItemId,
      });
    }
    return { ok: true, readAt };
  } catch (error) {
    return mapUnexpectedFailure(error, operation, {
      householdId: gate.householdId,
      inboxItemId,
    });
  }
}

export function markInboxItemRead(
  inboxItemId: string,
): Promise<InboxReadStateResult> {
  const parsed = inboxReadStateInputSchema.safeParse({ inboxItemId });
  if (!parsed.success)
    return Promise.resolve({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
  return setInboxReadState(
    parsed.data.inboxItemId,
    new Date().toISOString(),
    INBOX_OPERATION.MARK_READ,
  );
}

export function markInboxItemUnread(
  inboxItemId: string,
): Promise<InboxReadStateResult> {
  const parsed = inboxReadStateInputSchema.safeParse({ inboxItemId });
  if (!parsed.success)
    return Promise.resolve({
      ok: false,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
  return setInboxReadState(
    parsed.data.inboxItemId,
    null,
    INBOX_OPERATION.MARK_UNREAD,
  );
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
    const { data, error } = await supabase.rpc(INBOX_RPC.RESOLVE_TO_JAR, {
      p_inbox_item_id: parsed.data.inboxItemId,
      p_jar_id: parsed.data.jarId,
    });

    if (error) {
      return mapRpcFailure(error, INBOX_OPERATION.RESOLVE_TO_JAR, {
        householdId: gate.householdId,
        inboxItemId: parsed.data.inboxItemId,
      });
    }
    if (!data) {
      return mapUnexpectedFailure(null, INBOX_OPERATION.RESOLVE_TO_JAR, {
        householdId: gate.householdId,
        inboxItemId: parsed.data.inboxItemId,
        responseInvalid: true,
      });
    }

    return { ok: true, ...mutationResult(data, InboxItemStatus.RESOLVED) };
  } catch (error) {
    return mapUnexpectedFailure(error, INBOX_OPERATION.RESOLVE_TO_JAR, {
      householdId: gate.householdId,
      inboxItemId: parsed.data.inboxItemId,
    });
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
    const { data, error } = await supabase.rpc(INBOX_RPC.DISMISS, {
      p_inbox_item_id: parsed.data.inboxItemId,
    });

    if (error) {
      return mapRpcFailure(error, INBOX_OPERATION.DISMISS, {
        householdId: gate.householdId,
        inboxItemId: parsed.data.inboxItemId,
      });
    }
    if (!data) {
      return mapUnexpectedFailure(null, INBOX_OPERATION.DISMISS, {
        householdId: gate.householdId,
        inboxItemId: parsed.data.inboxItemId,
        responseInvalid: true,
      });
    }

    return { ok: true, ...mutationResult(data, InboxItemStatus.DISMISSED) };
  } catch (error) {
    return mapUnexpectedFailure(error, INBOX_OPERATION.DISMISS, {
      householdId: gate.householdId,
      inboxItemId: parsed.data.inboxItemId,
    });
  }
}

const ACK_ACTION_VALUES = [
  ...SAVINGS_MATURITY_ACK_ACTION_VALUES,
  ...EARLY_WITHDRAWAL_ACK_ACTION_VALUES,
  EmiAckAction.CELEBRATE,
  EmiAckAction.LATER,
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
    const { data, error } = await supabase.rpc(INBOX_RPC.ACKNOWLEDGE, {
      p_inbox_item_id: parsed.data.inboxItemId,
      p_action: parsed.data.action,
    });

    if (error) {
      return mapRpcFailure(error, INBOX_OPERATION.ACKNOWLEDGE, {
        householdId: gate.householdId,
        inboxItemId: parsed.data.inboxItemId,
        action: parsed.data.action,
      });
    }
    if (!data) {
      return mapUnexpectedFailure(null, INBOX_OPERATION.ACKNOWLEDGE, {
        householdId: gate.householdId,
        inboxItemId: parsed.data.inboxItemId,
        action: parsed.data.action,
        responseInvalid: true,
      });
    }

    return {
      ok: true,
      ...mutationResult(data, InboxItemStatus.ACKNOWLEDGED, true),
    };
  } catch (error) {
    return mapUnexpectedFailure(error, INBOX_OPERATION.ACKNOWLEDGE, {
      householdId: gate.householdId,
      inboxItemId: parsed.data.inboxItemId,
      action: parsed.data.action,
    });
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
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc(INBOX_RPC.AUTO_RESOLVE, {
      p_inbox_item_id: parsed.data.inboxItemId,
    });

    if (error) {
      return mapRpcFailure(error, INBOX_OPERATION.AUTO_RESOLVE, {
        householdId: gate.householdId,
        inboxItemId: parsed.data.inboxItemId,
      });
    }
    if (!data) {
      return mapUnexpectedFailure(null, INBOX_OPERATION.AUTO_RESOLVE, {
        householdId: gate.householdId,
        inboxItemId: parsed.data.inboxItemId,
        responseInvalid: true,
      });
    }

    return {
      ok: true,
      ...mutationResult(data, InboxItemStatus.AUTO_RESOLVED),
    };
  } catch (error) {
    return mapUnexpectedFailure(error, INBOX_OPERATION.AUTO_RESOLVE, {
      householdId: gate.householdId,
      inboxItemId: parsed.data.inboxItemId,
    });
  }
}

/**
 * Validate that an acknowledge action is allowed for a canonical kind
 * (Prompt 13A outcome contract). Savings orchestration uses this before
 * delegating to Savings commands.
 */
export function isAckActionAllowedForKind(
  kind: InboxItemKind,
  action: string,
): boolean {
  return kindAckActions(kind).includes(action);
}

export {
  EmiAckAction,
  SavingsMaturityAckAction,
  InboxItemKind,
  InboxItemStatus,
};
