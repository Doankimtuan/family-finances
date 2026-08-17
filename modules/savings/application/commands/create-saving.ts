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
  MaturityTargetMode,
  MaturityFallbackPolicy,
  SAVINGS_RPC,
} from "../savings-constants";
import {
  classifySavingsRpcError,
  logSavingsFailure,
  savingsFailureCode,
} from "../savings-error";
import { resolvePackageSnapshot } from "../savings-provider-registry";
import {
  addSavingsTerm,
  assertCompatibleSavingsAccounts,
  familyForLegacySavingType,
} from "../savings-domain-rules";
import { calculateInterest } from "../savings-interest";
import {
  emptyRenewalConfig,
  type ProductSnapshot,
  type PackageSnapshot,
  type RenewalConfig,
} from "../savings-types";
import {
  CreateSavingInput,
  createSavingInputSchema,
} from "./create-saving.schema";
export {
  createSavingInputSchema,
  type CreateSavingInput,
  type CreateSavingParsed,
} from "./create-saving.schema";

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
  if (!resolved || resolved.providerId !== parsed.data.providerId) {
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

  const startDate =
    parsed.data.startDate ?? new Date().toISOString().slice(0, 10);
  const endDate =
    packageSnapshot.termAmount && packageSnapshot.termUnit
      ? addSavingsTerm(startDate, {
          amount: packageSnapshot.termAmount,
          unit: packageSnapshot.termUnit,
        })
      : (() => {
          const endDateObj = new Date(`${startDate}T00:00:00Z`);
          endDateObj.setUTCDate(
            endDateObj.getUTCDate() + packageSnapshot.durationDays,
          );
          return endDateObj.toISOString().slice(0, 10);
        })();
  const interestCalculationMethod =
    packageSnapshot.interestCalculationMethod ?? parsed.data.interestCalcMethod;
  const estimatedInterest = calculateInterest({
    principal: parsed.data.principal,
    annualRate: packageSnapshot.annualInterestRate,
    startDate,
    endDate,
    method: interestCalculationMethod,
  }).totalInterest;

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
    targetMode:
      parsed.data.renewalConfig?.targetMode ??
      MaturityTargetMode.KEEP_CURRENT_PACKAGE,
    targetPackageId:
      parsed.data.renewalConfig?.targetPackageId ??
      parsed.data.renewalConfig?.preferredPackageId ??
      parsed.data.packageId,
    payoutAccountId:
      parsed.data.renewalConfig?.payoutAccountId ??
      parsed.data.renewalConfig?.preferredSettlementAccountId ??
      parsed.data.settlementAccountId,
    fallbackPolicy: MaturityFallbackPolicy.ASK_USER,
  };

  const productSnapshot: ProductSnapshot = {
    packageId: parsed.data.packageId,
    providerId: resolved.providerId,
    productName: resolved.productName,
    packageName: packageSnapshot.packageName,
    depositTermDays: packageSnapshot.durationDays,
    annualInterestRate: packageSnapshot.annualInterestRate,
    interestCalculationMethod,
    settlementRule: parsed.data.settlementRule,
    renewalPolicy,
    penaltyStrategy: parsed.data.penaltyStrategy,
    providerRules: {},
    savingsFamily:
      resolved.providerFamily === "BANK"
        ? "BANK"
        : familyForLegacySavingType(
            resolved.providerFamily ?? "digital_saving",
          ),
    providerNameSnapshot: resolved.productName,
    providerKey: resolved.providerKey,
    currency: packageSnapshot.currency ?? "VND",
    taxRule: packageSnapshot.taxRule,
    taxRatePercent: packageSnapshot.taxRatePercent,
    termAmount: packageSnapshot.termAmount,
    termUnit: packageSnapshot.termUnit,
    settlementRules: packageSnapshot.settlementRules,
    earlySettlementRule: packageSnapshot.earlySettlementRule,
    earlySettlementRatePercent: packageSnapshot.earlySettlementRatePercent,
    supportsPartialSettlement: packageSnapshot.supportsPartialSettlement,
  };

  const cyclePackageSnapshot: PackageSnapshot = { ...packageSnapshot };

  try {
    const supabase = await createSupabaseServerClient();

    const { data: fundingAccount, error: fundingAccountError } = await supabase
      .from("accounts")
      .select("id, type")
      .eq("household_id", gate.householdId)
      .eq("id", parsed.data.fundingAccountId)
      .eq("is_archived", false)
      .maybeSingle();

    if (fundingAccountError) {
      return {
        ok: false,
        code: savingsFailureCode(fundingAccountError, SAVINGS_RPC.CREATE, {
          householdId: gate.householdId,
          fundingAccountId: parsed.data.fundingAccountId,
        }),
      };
    }
    if (!fundingAccount) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    if (fundingAccount.type === AccountType.CREDIT_CARD) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const { data: settlementAccount, error: settlementAccountError } =
      await supabase
        .from("accounts")
        .select("id, type")
        .eq("household_id", gate.householdId)
        .eq("id", parsed.data.settlementAccountId)
        .eq("is_archived", false)
        .maybeSingle();

    if (settlementAccountError) {
      return {
        ok: false,
        code: savingsFailureCode(settlementAccountError, SAVINGS_RPC.CREATE, {
          householdId: gate.householdId,
          settlementAccountId: parsed.data.settlementAccountId,
        }),
      };
    }
    if (!settlementAccount) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    const accountCompatibility = assertCompatibleSavingsAccounts({
      fundingAccountType: fundingAccount.type,
      settlementAccountType: settlementAccount.type,
      fundingAccountId: fundingAccount.id,
      settlementAccountId: settlementAccount.id,
    });
    if (!accountCompatibility.ok) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const { data, error } = await supabase.rpc(SAVINGS_RPC.CREATE, {
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
      p_idempotency_key: parsed.data.idempotencyKey ?? null,
    });

    if (error) {
      const code = classifySavingsRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logSavingsFailure(error, SAVINGS_RPC.CREATE, {
          householdId: gate.householdId,
          providerId: parsed.data.providerId,
          packageId: parsed.data.packageId,
          fundingAccountId: parsed.data.fundingAccountId,
          settlementAccountId: parsed.data.settlementAccountId,
        });
      }
      return { ok: false, code };
    }

    const payload = data as {
      ok?: boolean;
      savingId?: string;
      cycleId?: string;
    } | null;

    if (!payload?.ok || !payload.savingId) {
      logSavingsFailure(null, SAVINGS_RPC.CREATE, {
        householdId: gate.householdId,
        providerId: parsed.data.providerId,
        packageId: parsed.data.packageId,
        fundingAccountId: parsed.data.fundingAccountId,
        settlementAccountId: parsed.data.settlementAccountId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return {
      ok: true,
      savingId: payload.savingId,
      cycleId: payload.cycleId ?? "",
      estimatedInterest,
    };
  } catch (error) {
    logSavingsFailure(error, SAVINGS_RPC.CREATE, {
      householdId: gate.householdId,
      providerId: parsed.data.providerId,
      packageId: parsed.data.packageId,
      fundingAccountId: parsed.data.fundingAccountId,
      settlementAccountId: parsed.data.settlementAccountId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
