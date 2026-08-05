import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import type { SavingProvider, SavingPackage } from "./savings-types";
import { mapProviderRow, mapPackageRow } from "./savings-types";

/**
 * Provider registry — resolves providers and packages from configurable DB rows.
 * No hardcoded provider logic. All provider data is data-driven.
 */

export async function listProviders(): Promise<SavingProvider[] | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("saving_providers")
      .select("id, provider_key, display_name, saving_type, is_active, metadata")
      .eq("is_active", true)
      .order("display_name");

    if (error) return null;
    return (data ?? []).map(mapProviderRow);
  } catch {
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
      .select("id, provider_key, display_name, saving_type, is_active, metadata")
      .eq("id", providerId)
      .maybeSingle();

    if (error || !data) return null;
    return mapProviderRow(data);
  } catch {
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
      .select("id, provider_key, display_name, saving_type, is_active, metadata")
      .eq("provider_key", providerKey)
      .maybeSingle();

    if (error || !data) return null;
    return mapProviderRow(data);
  } catch {
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
      .select(
        "id, provider_id, package_name, duration_days, annual_interest_rate, min_amount, max_amount, settlement_rules, penalty_rules, renewable_available, is_active",
      )
      .eq("provider_id", providerId)
      .eq("is_active", true)
      .order("duration_days");

    if (error) return null;
    return (data ?? []).map(mapPackageRow);
  } catch {
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
      .select(
        "id, provider_id, package_name, duration_days, annual_interest_rate, min_amount, max_amount, settlement_rules, penalty_rules, renewable_available, is_active",
      )
      .eq("id", packageId)
      .maybeSingle();

    if (error || !data) return null;
    return mapPackageRow(data);
  } catch {
    return null;
  }
}

/**
 * Resolve an active package by ID and return its snapshot for immutable storage.
 */
export async function resolvePackageSnapshot(
  packageId: string,
): Promise<{
  packageSnapshot: import("./savings-types").PackageSnapshot;
  providerId: string;
  productName: string;
} | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("saving_packages")
      .select(
        "id, provider_id, package_name, duration_days, annual_interest_rate, min_amount, max_amount, settlement_rules, penalty_rules, renewable_available, is_active, saving_providers(display_name, provider_key)",
      )
      .eq("id", packageId)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) return null;

    const pkg = mapPackageRow(data);

    // Supabase joins may return arrays
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spRaw = (data as any)?.saving_providers;
    const providerRecord = Array.isArray(spRaw) ? spRaw[0] : spRaw;
    const providerName = providerRecord?.display_name ?? "";

    return {
      packageSnapshot: {
        packageName: pkg.packageName,
        durationDays: pkg.durationDays,
        annualInterestRate: pkg.annualInterestRate,
        settlementRules: pkg.settlementRules,
        penaltyRules: pkg.penaltyRules,
        renewableAvailable: pkg.renewableAvailable,
        minAmount: pkg.minAmount,
        maxAmount: pkg.maxAmount,
      },
      providerId: pkg.providerId,
      productName: providerName,
    };
  } catch {
    return null;
  }
}
