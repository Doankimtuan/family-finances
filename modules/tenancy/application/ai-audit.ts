import "server-only";

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  recordAiAuditEventInputSchema,
  type RecordAiAuditEventInput,
} from "./ai-audit.schema";

const AI_AUDIT_ERROR_CONTEXT = "[tenancy.ai-audit]";

export {
  AiAuditEventKind,
  AI_AUDIT_EVENT_KIND_VALUES,
  recordAiAuditEventInputSchema,
  type RecordAiAuditEventInput,
} from "./ai-audit.schema";
export type { AiAuditEventKind as AiAuditEventKindValue } from "./ai-audit.schema";

/**
 * Append-only AI / assist suggestion audit (BR-14 / ST-E06-002).
 * Records suggestions and optional explicit user approvals — never invents balances.
 */

export type RecordAiAuditEventResult =
  { ok: true; id: string } | { ok: false; code: ProductActionErrorCode };

export async function recordAiAuditEvent(
  raw: RecordAiAuditEventInput,
): Promise<RecordAiAuditEventResult> {
  const parsed = recordAiAuditEventInputSchema.safeParse(raw);
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
    const { data, error } = await supabase
      .from("ai_audit_logs")
      .insert({
        household_id: gate.householdId,
        actor_user_id: gate.userId,
        event_kind: parsed.data.kind,
        surface: parsed.data.surface,
        payload_json: parsed.data.payload,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, id: data.id as string };
  } catch (error) {
    console.error(AI_AUDIT_ERROR_CONTEXT, error);
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
