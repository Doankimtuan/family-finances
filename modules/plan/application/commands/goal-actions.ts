import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";

const uuid = z.string().uuid();
const lifecycleAction = z.enum(["pause", "resume", "complete", "cancel"]);

export type GoalLifecycleAction = z.infer<typeof lifecycleAction>;
export type GoalActionResult =
  | { ok: true }
  | { ok: false; code: ProductActionErrorCode };

function unknownResult(): GoalActionResult {
  return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
}

export async function changeGoalLifecycle(input: {
  goalId: string;
  action: GoalLifecycleAction;
}): Promise<GoalActionResult> {
  const parsed = z
    .object({ goalId: uuid, action: lifecycleAction })
    .safeParse(input);
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
    const { data, error } = await supabase.rpc("change_goal_lifecycle", {
      p_goal_id: parsed.data.goalId,
      p_action: parsed.data.action,
    });
    if (error || !data) return unknownResult();
    return { ok: true };
  } catch {
    return unknownResult();
  }
}

export async function reassignGoalFundingSource(input: {
  linkId: string;
  fromGoalId: string;
  toGoalId: string;
}): Promise<GoalActionResult> {
  const parsed = z.object({ linkId: uuid, fromGoalId: uuid, toGoalId: uuid }).safeParse(input);
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
    const { data, error } = await supabase.rpc(
      "reassign_goal_funding_source",
      {
        p_link_id: parsed.data.linkId,
        p_from_goal_id: parsed.data.fromGoalId,
        p_to_goal_id: parsed.data.toGoalId,
      },
    );
    if (error || !data) return unknownResult();
    return { ok: true };
  } catch {
    return unknownResult();
  }
}
