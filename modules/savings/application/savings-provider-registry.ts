import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import type { SavingProvider, SavingPackage } from "./savings-types";
import { mapProviderRow, mapPackageRow } from "./savings-types";
import { SAVINGS_OPERATION } from "./savings-constants";
import {
  classifySavingsRpcError,
  isRecord,
  logSavingsFailure,
} from "./savings-error";

/**
 * Provider registry — resolves providers and packages from configurable DB rows.
 * No hardcoded provider logic. All provider data is data-driven.
 */

const PROVIDER_SELECT =
  "id, provider_key, display_name, saving_type, is_active, metadata, family, icon_key, household_id, is_system";
const PACKAGE_SELECT =
  "id, provider_id, package_name, duration_days, annual_interest_rate, min_amount, max_amount, settlement_rules, penalty_rules, renewable_available, is_active, term_amount, term_unit, interest_calculation_method, currency, tax_rule, tax_rate_percent, early_settlement_rule, early_settlement_rate_percent, supports_partial_settlement";

export type SavingCatalogProvider = SavingProvider & {
  packages: SavingPackage[];
};

export async function listProviders(): Promise<SavingProvider[] | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("saving_providers")
      .select(PROVIDER_SELECT)
      .eq("is_active", true)
      .eq("saving_packages.is_active", true)
      .order("display_name");
    if (error) {
      if (
        classifySavingsRpcError(error) === PRODUCT_ACTION_ERROR_CODE.UNKNOWN
      ) {
        logSavingsFailure(error, SAVINGS_OPERATION.PROVIDER_REGISTRY, {});
      }
      return null;
    }
    return (data ?? []).map(mapProviderRow);
  } catch (error) {
    logSavingsFailure(error, SAVINGS_OPERATION.PROVIDER_REGISTRY, {});
    return null;
  }
}

/** Active system and household providers with active products in one query. */
export async function listProviderCatalog(): Promise<
  SavingCatalogProvider[] | null
> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("saving_providers")
      .select(
        `${PROVIDER_SELECT}, saving_packages!saving_packages_provider_id_fkey(${PACKAGE_SELECT})`,
      )
      .eq("is_active", true)
      .eq("saving_packages.is_active", true)
      .order("display_name");
    if (error) {
      if (
        classifySavingsRpcError(error) === PRODUCT_ACTION_ERROR_CODE.UNKNOWN
      ) {
        logSavingsFailure(error, SAVINGS_OPERATION.PROVIDER_REGISTRY, {});
      }
      return null;
    }
    return (data ?? []).map((row) => {
      const provider = mapProviderRow(row);
      const rawPackages = Array.isArray(row.saving_packages)
        ? row.saving_packages
        : [];
      return {
        ...provider,
        packages: rawPackages.map((pkg) => mapPackageRow(pkg)),
      };
    });
  } catch (error) {
    logSavingsFailure(error, SAVINGS_OPERATION.PROVIDER_REGISTRY, {});
    return null;
  }
}
export async function getProvider(
  providerId: string,
): Promise<SavingProvider | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("saving_providers")
      .select(
        "id, provider_key, display_name, saving_type, is_active, metadata, family, icon_key, household_id, is_system",
      )
      .eq("id", providerId)
      .maybeSingle();

    if (error) {
      if (
        classifySavingsRpcError(error) === PRODUCT_ACTION_ERROR_CODE.UNKNOWN
      ) {
        logSavingsFailure(error, SAVINGS_OPERATION.PROVIDER_REGISTRY, {
          providerId,
        });
      }
      return null;
    }
    if (!data) return null;
    return mapProviderRow(data);
  } catch (error) {
    logSavingsFailure(error, SAVINGS_OPERATION.PROVIDER_REGISTRY, {
      providerId,
    });
    return null;
  }
}

export async function getProviderByKey(
  providerKey: string,
): Promise<SavingProvider | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("saving_providers")
      .select(
        "id, provider_key, display_name, saving_type, is_active, metadata, family, icon_key, household_id, is_system",
      )
      .eq("provider_key", providerKey)
      .maybeSingle();

    if (error) {
      if (
        classifySavingsRpcError(error) === PRODUCT_ACTION_ERROR_CODE.UNKNOWN
      ) {
        logSavingsFailure(error, SAVINGS_OPERATION.PROVIDER_REGISTRY, {});
      }
      return null;
    }
    if (!data) return null;
    return mapProviderRow(data);
  } catch (error) {
    logSavingsFailure(error, SAVINGS_OPERATION.PROVIDER_REGISTRY, {});
    return null;
  }
}

export async function listProviderPackages(
  providerId: string,
): Promise<SavingPackage[] | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("saving_packages")
      .select(PACKAGE_SELECT)
      .eq("provider_id", providerId)
      .eq("is_active", true)
      .order("duration_days");

    if (error) {
      if (
        classifySavingsRpcError(error) === PRODUCT_ACTION_ERROR_CODE.UNKNOWN
      ) {
        logSavingsFailure(error, SAVINGS_OPERATION.PROVIDER_REGISTRY, {
          providerId,
        });
      }
      return null;
    }
    return (data ?? []).map(mapPackageRow);
  } catch (error) {
    logSavingsFailure(error, SAVINGS_OPERATION.PROVIDER_REGISTRY, {
      providerId,
    });
    return null;
  }
}

export async function getPackage(
  packageId: string,
): Promise<SavingPackage | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("saving_packages")
      .select(PACKAGE_SELECT)
      .eq("id", packageId)
      .maybeSingle();

    if (error) {
      if (
        classifySavingsRpcError(error) === PRODUCT_ACTION_ERROR_CODE.UNKNOWN
      ) {
        logSavingsFailure(error, SAVINGS_OPERATION.PROVIDER_REGISTRY, {
          packageId,
        });
      }
      return null;
    }
    if (!data) return null;
    return mapPackageRow(data);
  } catch (error) {
    logSavingsFailure(error, SAVINGS_OPERATION.PROVIDER_REGISTRY, {
      packageId,
    });
    return null;
  }
}

/**
 * Resolve an active package by ID and return its snapshot for immutable storage.
 */
export async function resolvePackageSnapshot(packageId: string): Promise<{
  packageSnapshot: import("./savings-types").PackageSnapshot;
  providerId: string;
  productName: string;
  providerFamily?: string;
  providerKey?: string;
} | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("saving_packages")
      .select(
        `${PACKAGE_SELECT}, saving_providers!inner(display_name, provider_key, family, icon_key, is_active)`,
      )
      .eq("id", packageId)
      .eq("is_active", true)
      .eq("saving_providers.is_active", true)
      .maybeSingle();

    if (error) {
      if (
        classifySavingsRpcError(error) === PRODUCT_ACTION_ERROR_CODE.UNKNOWN
      ) {
        logSavingsFailure(error, SAVINGS_OPERATION.PROVIDER_REGISTRY, {
          packageId,
        });
      }
      return null;
    }
    if (!data) return null;

    const pkg = mapPackageRow(data);

    // Supabase joins may return arrays.
    const spRaw = isRecord(data) ? data.saving_providers : undefined;
    const providerRecord = Array.isArray(spRaw) ? spRaw[0] : spRaw;
    const providerName = providerRecord?.display_name ?? "";

    return {
      packageSnapshot: {
        packageId: pkg.id,
        packageName: pkg.packageName,
        durationDays: pkg.durationDays,
        annualInterestRate: pkg.annualInterestRate,
        settlementRules: pkg.settlementRules,
        penaltyRules: pkg.penaltyRules,
        renewableAvailable: pkg.renewableAvailable,
        minAmount: pkg.minAmount,
        maxAmount: pkg.maxAmount,
        termAmount: pkg.termAmount,
        termUnit: pkg.termUnit,
        interestCalculationMethod: pkg.interestCalculationMethod,
        currency: pkg.currency,
        taxRule: pkg.taxRule,
        taxRatePercent: pkg.taxRatePercent,
        earlySettlementRule: pkg.earlySettlementRule,
        earlySettlementRatePercent: pkg.earlySettlementRatePercent,
        supportsPartialSettlement: pkg.supportsPartialSettlement,
      },
      providerId: pkg.providerId,
      productName: providerName,
      providerFamily: providerRecord?.family ?? undefined,
      providerKey: providerRecord?.provider_key ?? undefined,
    };
  } catch (error) {
    logSavingsFailure(error, SAVINGS_OPERATION.PROVIDER_REGISTRY, {
      packageId,
    });
    return null;
  }
}
