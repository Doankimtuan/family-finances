import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { AccountType } from "@/modules/ledger/application/ledger-constants";
import {
  RenewalPolicy,
  SettlementRule,
  InterestCalcMethod,
  PenaltyStrategy,
  RENEWAL_POLICY_VALUES,
  SETTLEMENT_RULE_VALUES,
  INTEREST_CALC_METHOD_VALUES,
  PENALTY_STRATEGY_VALUES,
} from "../savings-constants";
import { resolvePackageSnapshot } from "../savings-provider-registry";
import { computeFullTermInterest } from "../savings-interest";
import {
  emptyRenewalConfig,
  type ProductSnapshot,
  type PackageSnapshot,
  type RenewalConfig,
} from "../savings-types";

const renewalConfigSchema = z.object({
  preferredPackageId: z.string().uuid().nullable().optional(),
  preferredSettlementRule: z.enum(SETTLEMENT_RULE_VALUES).optional(),
  preferredSettlementAccountId: z.string().uuid().nullable().optional(),
});

export const createSavingInputSchema = z.object({
  fundingAccountId: z.string().uuid(),
  settlementAccountId: z.string().uuid(),
  providerId: z.string().uuid(),
  packageId: z.string().uuid(),
  principal: z.number().finite().int().positive(),
  renewalPolicy: z
    .enum(RENEWAL_POLICY_VALUES)
    .default(RenewalPolicy.ALWAYS_ASK),
  /** @deprecated Use renewalPolicy. */
  renewalPreference: z.enum(RENEWAL_POLICY_VALUES).optional(),
  renewalConfig: renewalConfigSchema.optional(),
  settlementRule: z
    .enum(SETTLEMENT_RULE_VALUES)
    .default(SettlementRule.WITHDRAW_EVERYTHING),
  interestCalcMethod: z
    .enum(INTEREST_CALC_METHOD_VALUES)
    .default(InterestCalcMethod.SIMPLE),
  penaltyStrategy: z
    .enum(PENALTY_STRATEGY_VALUES)
    .default(PenaltyStrategy.NO_INTEREST),
});

export type CreateSavingInput = z.input<typeof createSavingInputSchema>;
export type CreateSavingParsed = z.output<typeof createSavingInputSchema>;

export type CreateSavingResult =
  | {
      ok: true;
      savingId: string;
      cycleId: string;
      estimatedInterest: number;
    }
  | { ok: false; code: ProductActionErrorCode };

export async function createSaving(
  raw: CreateSavingInput,
): Promise<CreateSavingResult> {
  const parsed = createSavingInputSchema.safeParse(raw);
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

  const resolved = await resolvePackageSnapshot(parsed.data.packageId);
  if (!resolved) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const { packageSnapshot } = resolved;
  const renewalPolicy =
    parsed.data.renewalPolicy ??
    parsed.data.renewalPreference ??
    RenewalPolicy.ALWAYS_ASK;

  if (
    packageSnapshot.minAmount != null &&
    parsed.data.principal < packageSnapshot.minAmount
  ) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  if (
    packageSnapshot.maxAmount != null &&
    parsed.data.principal > packageSnapshot.maxAmount
  ) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const estimatedInterest = computeFullTermInterest({
    principal: parsed.data.principal,
    annualRate: packageSnapshot.annualInterestRate,
    durationDays: packageSnapshot.durationDays,
    method: parsed.data.interestCalcMethod,
  });

  const baseConfig = emptyRenewalConfig();
  const renewalConfig: RenewalConfig = {
    preferredPackageId:
      parsed.data.renewalConfig?.preferredPackageId ??
      (renewalPolicy === RenewalPolicy.ALWAYS_ASK
        ? null
        : parsed.data.packageId),
    preferredSettlementRule:
      parsed.data.renewalConfig?.preferredSettlementRule ??
      parsed.data.settlementRule,
    preferredSettlementAccountId:
      parsed.data.renewalConfig?.preferredSettlementAccountId ??
      parsed.data.settlementAccountId,
  };

  const productSnapshot: ProductSnapshot = {
    providerId: resolved.providerId,
    productName: resolved.productName,
    packageName: packageSnapshot.packageName,
    depositTermDays: packageSnapshot.durationDays,
    annualInterestRate: packageSnapshot.annualInterestRate,
    interestCalculationMethod: parsed.data.interestCalcMethod,
    settlementRule: parsed.data.settlementRule,
    renewalPolicy,
    penaltyStrategy: parsed.data.penaltyStrategy,
    providerRules: {},
  };

  const cyclePackageSnapshot: PackageSnapshot = { ...packageSnapshot };

  const startDate = new Date().toISOString().slice(0, 10);
  const endDateObj = new Date();
  endDateObj.setDate(endDateObj.getDate() + packageSnapshot.durationDays);
  const endDate = endDateObj.toISOString().slice(0, 10);

  try {
    const supabase = await createSupabaseServerClient();

    const { data: fundingAccount } = await supabase
      .from("accounts")
      .select("id, type")
      .eq("household_id", gate.householdId)
      .eq("id", parsed.data.fundingAccountId)
      .eq("is_archived", false)
      .maybeSingle();

    if (!fundingAccount) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    if (fundingAccount.type === AccountType.CREDIT_CARD) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const { data: settlementAccount } = await supabase
      .from("accounts")
      .select("id")
      .eq("household_id", gate.householdId)
      .eq("id", parsed.data.settlementAccountId)
      .eq("is_archived", false)
      .maybeSingle();

    if (!settlementAccount) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const { data, error } = await supabase.rpc("create_saving_with_transfer", {
      p_funding_account_id: parsed.data.fundingAccountId,
      p_principal: parsed.data.principal,
      p_provider_id: parsed.data.providerId,
      p_product_name: resolved.productName,
      p_product_snapshot: productSnapshot,
      p_renewal_preference: renewalPolicy,
      p_settlement_account_id: parsed.data.settlementAccountId,
      p_cycle_start_date: startDate,
      p_cycle_end_date: endDate,
      p_package_snapshot: cyclePackageSnapshot,
      p_renewal_config: renewalConfig ?? baseConfig,
    });

    if (error) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    const payload = data as {
      ok?: boolean;
      savingId?: string;
      cycleId?: string;
    } | null;

    if (!payload?.ok || !payload.savingId) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return {
      ok: true,
      savingId: payload.savingId,
      cycleId: payload.cycleId ?? "",
      estimatedInterest,
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
