import "server-only";

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import type { Result } from "@/modules/shared-kernel/application/result";
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
import { logTenancyFailure } from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

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

export type RecordAiAuditEventResult = Result<
  { id: string },
  ProductActionErrorCode
>;

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

    if (error) {
      logTenancyFailure(TENANCY_OPERATION.AI_AUDIT, error, {
        householdId: gate.householdId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    if (!data?.id) {
      logTenancyFailure(
        TENANCY_OPERATION.AI_AUDIT,
        new Error("AI audit insert returned an invalid id"),
        { householdId: gate.householdId },
      );
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, id: data.id as string };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.AI_AUDIT, error, {
      householdId: gate.householdId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
