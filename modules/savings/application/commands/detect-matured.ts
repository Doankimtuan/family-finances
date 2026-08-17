import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { listProviderPackages } from "../savings-provider-registry";
import { computeFullTermInterest } from "../savings-interest";
import {
  InterestCalcMethod,
  RenewalPolicy,
  RenewalSuggestedAction,
  SettlementRule,
  MaturityWarningCode,
  SAVINGS_RPC,
  SAVINGS_OPERATION,
} from "../savings-constants";
import {
  classifySavingsRpcError,
  isRecord,
  logSavingsFailure,
} from "../savings-error";
import type {
  ProductSnapshot,
  PackageRecommendation,
  MaturityWarning,
  RenewalConfig,
} from "../savings-types";
import { recommendPackages } from "../savings-recommendation";
import {
  mapLegacyRenewalPreference,
  suggestedActionForPolicy,
  renewalConfidenceForPolicy,
} from "../renewal-policy-map";

export type DetectMaturedResult =
  | { ok: true; maturedCount: number; cascadeCount: number }
  | { ok: false; code: ProductActionErrorCode };

/** Detect matured cycles and enqueue BR-10 + 3/1 cascade reminders. */
export async function detectMaturedSavings(): Promise<DetectMaturedResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data: matured, error: maturedError } = await supabase.rpc(
      SAVINGS_RPC.DETECT_MATURED,
      { p_household_id: gate.householdId },
    );
    if (maturedError) {
      const code = classifySavingsRpcError(maturedError);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logSavingsFailure(maturedError, SAVINGS_RPC.DETECT_MATURED, {
          householdId: gate.householdId,
        });
      }
      return { ok: false, code };
    }

    const { data: cascade, error: cascadeError } = await supabase.rpc(
      SAVINGS_RPC.ENQUEUE_MATURITY_CASCADE,
      { p_household_id: gate.householdId },
    );
    if (cascadeError) {
      const code = classifySavingsRpcError(cascadeError);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logSavingsFailure(cascadeError, SAVINGS_RPC.ENQUEUE_MATURITY_CASCADE, {
          householdId: gate.householdId,
        });
      }
      return { ok: false, code };
    }

    const maturedPayload = matured as { maturedCount?: number } | null;
    const cascadePayload = cascade as { cascadeCount?: number } | null;

    return {
      ok: true,
      maturedCount: Number(maturedPayload?.maturedCount ?? 0),
      cascadeCount: Number(cascadePayload?.cascadeCount ?? 0),
    };
  } catch (error) {
    logSavingsFailure(error, SAVINGS_RPC.DETECT_MATURED, {
      householdId: gate.householdId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export type MaturityReviewPackage = {
  packageId: string;
  packageName: string;
  durationDays: number;
  annualRate: number;
  rateDifference?: number;
  durationDeltaDays?: number;
  reasonCode?: string;
};

export type MaturityReviewPayload = {
  savingId: string;
  cycleId: string;
  providerName: string;
  currentPackage: string;
  currentRate: number;
  previousRate: number | null;
  rateDifference: number;
  recommendedPackages: MaturityReviewPackage[];
  estimatedInterest: number;
  configuredRenewalPreference: string;
  renewalPolicy: string;
  renewalConfig: RenewalConfig;
  settlementRule: string;
  principal: number;
  accruedInterest: number;
  maturityDate: string;
  suggestedAction: string;
  renewalConfidence: number;
  warnings: MaturityWarning[];
  preselectedPackageId: string | null;
  preselectedSettlementRule: string;
  preselectedSettlementAccountId: string | null;
  recommendationReason: string | null;
};

/** Hydrate rich maturity ReviewItem payload from saving + recommendation engine. */
export async function buildMaturityReviewPayload(input: {
  savingId: string;
  cycleId: string;
}): Promise<MaturityReviewPayload | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();

    const { data: saving } = await supabase
      .from("savings")
      .select(
        `id, product_name, product_snapshot, renewal_policy, renewal_config,
         settlement_account_id, provider_id,
         saving_providers:provider_id(display_name, is_active)`,
      )
      .eq("id", input.savingId)
      .eq("household_id", gate.householdId)
      .maybeSingle();

    if (!saving) return null;

    const { data: cycle } = await supabase
      .from("saving_cycles")
      .select(
        "id, principal, locked_rate, package_snapshot, accrued_interest, end_date, cycle_number, saving_id",
      )
      .eq("id", input.cycleId)
      .eq("saving_id", input.savingId)
      .maybeSingle();

    if (!cycle) return null;

    const { data: prevCycle } = await supabase
      .from("saving_cycles")
      .select("locked_rate")
      .eq("saving_id", input.savingId)
      .eq("cycle_number", (cycle.cycle_number as number) - 1)
      .maybeSingle();

    const spRaw = isRecord(saving) ? saving.saving_providers : undefined;
    const provider = Array.isArray(spRaw) ? spRaw[0] : spRaw;
    const providerName = provider?.display_name ?? "";
    const providerActive = provider?.is_active !== false;

    const productSnapshot = saving.product_snapshot as ProductSnapshot;
    const renewalPolicy = mapLegacyRenewalPreference(
      saving.renewal_policy as string,
    );
    const rawConfig = (saving.renewal_config ?? {}) as Partial<RenewalConfig>;
    const renewalConfig: RenewalConfig = {
      preferredPackageId: rawConfig.preferredPackageId ?? null,
      preferredSettlementRule:
        rawConfig.preferredSettlementRule ??
        productSnapshot.settlementRule ??
        SettlementRule.ROLL_PRINCIPAL_INTEREST,
      preferredSettlementAccountId:
        rawConfig.preferredSettlementAccountId ??
        saving.settlement_account_id ??
        null,
    };

    const packages = await listProviderPackages(saving.provider_id);
    const packageSnapshot = cycle.package_snapshot as {
      packageName?: string;
      durationDays?: number;
    };
    const currentRate = Number(cycle.locked_rate);
    const currentDuration =
      packageSnapshot.durationDays ?? productSnapshot.depositTermDays;

    const rec = recommendPackages({
      currentPackageName:
        packageSnapshot.packageName ?? productSnapshot.packageName,
      currentDurationDays: currentDuration,
      currentRate,
      preferredPackageId: renewalConfig.preferredPackageId,
      catalog: packages ?? [],
    });

    const warnings: MaturityWarning[] = [...rec.warnings];
    if (!providerActive) {
      warnings.push({ code: MaturityWarningCode.PROVIDER_INACTIVE });
    }

    const suggestedAction = suggestedActionForPolicy(
      renewalPolicy,
      renewalConfig.preferredSettlementRule,
    );
    // If preferred package gone and action was confirm, keep confirm only if alts exist
    let finalSuggested = suggestedAction;
    if (
      suggestedAction === RenewalSuggestedAction.CONFIRM_CONFIGURED &&
      renewalConfig.preferredPackageId &&
      !rec.preferredPackageActive &&
      rec.recommendations.length === 0
    ) {
      finalSuggested = RenewalSuggestedAction.NONE;
    }

    const principal = Number(cycle.principal);
    const previousRate =
      prevCycle?.locked_rate != null ? Number(prevCycle.locked_rate) : null;

    const estimatedInterest = computeFullTermInterest({
      principal,
      annualRate: currentRate,
      durationDays: currentDuration,
      method:
        productSnapshot.interestCalculationMethod ?? InterestCalcMethod.SIMPLE,
    });

    const recommendedPackages: MaturityReviewPackage[] =
      rec.recommendations.map((r: PackageRecommendation) => ({
        packageId: r.packageId,
        packageName: r.packageName,
        durationDays: r.durationDays,
        annualRate: r.annualRate,
        rateDifference: r.rateDifference,
        durationDeltaDays: r.durationDeltaDays,
        reasonCode: r.reasonCode,
      }));

    const preselectedPackageId =
      rec.preferredPackage?.id ??
      (renewalPolicy === RenewalPolicy.ALWAYS_ASK
        ? null
        : (recommendedPackages[0]?.packageId ?? null));

    return {
      savingId: input.savingId,
      cycleId: input.cycleId,
      providerName,
      currentPackage:
        packageSnapshot.packageName ?? productSnapshot.packageName,
      currentRate,
      previousRate,
      rateDifference: previousRate != null ? currentRate - previousRate : 0,
      recommendedPackages,
      estimatedInterest,
      configuredRenewalPreference: renewalPolicy,
      renewalPolicy,
      renewalConfig,
      settlementRule: renewalConfig.preferredSettlementRule,
      principal,
      accruedInterest: Number(cycle.accrued_interest ?? 0),
      maturityDate: cycle.end_date,
      suggestedAction: finalSuggested,
      renewalConfidence: renewalConfidenceForPolicy(renewalPolicy),
      warnings,
      preselectedPackageId,
      preselectedSettlementRule: renewalConfig.preferredSettlementRule,
      preselectedSettlementAccountId:
        renewalConfig.preferredSettlementAccountId,
      recommendationReason: recommendedPackages[0]?.reasonCode ?? null,
    };
  } catch (error) {
    logSavingsFailure(error, SAVINGS_OPERATION.MATURITY_ENRICHMENT, {
      savingId: input.savingId,
      cycleId: input.cycleId,
    });
    return null;
  }
}

export type BackfillLegacyResult =
  | { ok: true; migratedCount: number }
  | { ok: false; code: ProductActionErrorCode };

/** Metadata-only legacy strangler (no invented ledger balances). */
export async function backfillLegacySavingsAccounts(): Promise<BackfillLegacyResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc(SAVINGS_RPC.BACKFILL_LEGACY, {
      p_household_id: gate.householdId,
    });
    if (error) {
      const code = classifySavingsRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logSavingsFailure(error, SAVINGS_RPC.BACKFILL_LEGACY, {
          householdId: gate.householdId,
        });
      }
      return { ok: false, code };
    }
    const payload = data as { ok?: boolean; migratedCount?: number } | null;
    if (!payload?.ok) {
      logSavingsFailure(null, SAVINGS_RPC.BACKFILL_LEGACY, {
        householdId: gate.householdId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, migratedCount: Number(payload.migratedCount ?? 0) };
  } catch (error) {
    logSavingsFailure(error, SAVINGS_RPC.BACKFILL_LEGACY, {
      householdId: gate.householdId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
