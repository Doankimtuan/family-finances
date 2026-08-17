import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  RenewalPolicy,
  RENEWAL_POLICY_VALUES,
  SETTLEMENT_RULE_VALUES,
  MATURITY_TARGET_MODE_VALUES,
  MaturityTargetMode,
  MaturityFallbackPolicy,
  SAVINGS_OPERATION,
} from "../savings-constants";
import { classifySavingsRpcError, logSavingsFailure } from "../savings-error";
import { emptyRenewalConfig, type RenewalConfig } from "../savings-types";

const renewalConfigSchema = z.object({
  preferredPackageId: z.string().uuid().nullable().optional(),
  preferredSettlementRule: z.enum(SETTLEMENT_RULE_VALUES).optional(),
  preferredSettlementAccountId: z.string().uuid().nullable().optional(),
  targetMode: z.enum(MATURITY_TARGET_MODE_VALUES).optional(),
  targetPackageId: z.string().uuid().nullable().optional(),
  payoutAccountId: z.string().uuid().nullable().optional(),
  fallbackPolicy: z.literal(MaturityFallbackPolicy.ASK_USER).optional(),
});

export const updateRenewalPolicyInputSchema = z.object({
  savingId: z.string().uuid(),
  renewalPolicy: z.enum(RENEWAL_POLICY_VALUES),
  renewalConfig: renewalConfigSchema.optional(),
});

export type UpdateRenewalPolicyInput = z.infer<
  typeof updateRenewalPolicyInputSchema
>;

export type UpdateRenewalPolicyResult =
  { ok: true; savingId: string } | { ok: false; code: ProductActionErrorCode };

/** Edit Renewal Policy on an existing saving (recommendation only). */
export async function updateRenewalPolicy(
  raw: UpdateRenewalPolicyInput,
): Promise<UpdateRenewalPolicyResult> {
  const parsed = updateRenewalPolicyInputSchema.safeParse(raw);
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

  const base = emptyRenewalConfig();
  const renewalConfig: RenewalConfig = {
    preferredPackageId: parsed.data.renewalConfig?.preferredPackageId ?? null,
    preferredSettlementRule:
      parsed.data.renewalConfig?.preferredSettlementRule ??
      base.preferredSettlementRule,
    preferredSettlementAccountId:
      parsed.data.renewalConfig?.preferredSettlementAccountId ?? null,
    targetMode:
      parsed.data.renewalConfig?.targetMode ??
      MaturityTargetMode.KEEP_CURRENT_PACKAGE,
    targetPackageId:
      parsed.data.renewalConfig?.targetPackageId ??
      parsed.data.renewalConfig?.preferredPackageId ??
      null,
    payoutAccountId:
      parsed.data.renewalConfig?.payoutAccountId ??
      parsed.data.renewalConfig?.preferredSettlementAccountId ??
      null,
    fallbackPolicy: MaturityFallbackPolicy.ASK_USER,
  };

  if (parsed.data.renewalPolicy === RenewalPolicy.ALWAYS_ASK) {
    renewalConfig.preferredPackageId = null;
    renewalConfig.targetPackageId = null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("savings")
      .update({
        renewal_policy: parsed.data.renewalPolicy,
        renewal_config: renewalConfig,
        maturity_instruction: {
          strategy: renewalConfig.preferredSettlementRule,
          targetMode: renewalConfig.targetMode,
          targetPackageId: renewalConfig.targetPackageId,
          payoutAccountId: renewalConfig.payoutAccountId,
          fallbackPolicy: MaturityFallbackPolicy.ASK_USER,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.savingId)
      .eq("household_id", gate.householdId)
      .select("id")
      .maybeSingle();

    if (error) {
      const code = classifySavingsRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logSavingsFailure(error, SAVINGS_OPERATION.UPDATE_RENEWAL_POLICY, {
          householdId: gate.householdId,
          savingId: parsed.data.savingId,
        });
      }
      return { ok: false, code };
    }
    if (!data) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    return { ok: true, savingId: data.id };
  } catch (error) {
    logSavingsFailure(error, SAVINGS_OPERATION.UPDATE_RENEWAL_POLICY, {
      householdId: gate.householdId,
      savingId: parsed.data.savingId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
