import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  defaultTaxConfigForFamily,
  legacySavingTypeForFamily,
  savingsProductInputSchema,
  savingsProviderInputSchema,
} from "../savings-domain-rules";
import {
  mapPackageRow,
  mapProviderRow,
  type SavingPackage,
  type SavingProvider,
} from "../savings-types";

const providerIdSchema = z.object({ providerId: z.string().uuid() });
const packageIdSchema = z.object({ packageId: z.string().uuid() });

export type SavingsCatalogResult<T> =
  { ok: true; value: T } | { ok: false; code: ProductActionErrorCode };

function makeProviderKey(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${slug || "provider"}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function createSavingsProvider(
  raw: unknown,
): Promise<SavingsCatalogResult<SavingProvider>> {
  const parsed = savingsProviderInputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("saving_providers")
      .insert({
        household_id: gate.householdId,
        created_by: gate.userId,
        provider_key: makeProviderKey(parsed.data.name),
        display_name: parsed.data.name,
        saving_type: legacySavingTypeForFamily(parsed.data.family),
        family: parsed.data.family,
        icon_key: parsed.data.iconKey,
        is_system: false,
        is_active: true,
        metadata: {},
      })
      .select(
        "id, provider_key, display_name, saving_type, is_active, metadata, family, icon_key, household_id, is_system",
      )
      .single();
    if (error || !data)
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    return { ok: true, value: mapProviderRow(data) };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export async function updateSavingsProvider(
  providerId: string,
  raw: unknown,
): Promise<SavingsCatalogResult<SavingProvider>> {
  const parsedId = providerIdSchema.safeParse({ providerId });
  const parsed = savingsProviderInputSchema.safeParse(raw);
  if (!parsedId.success || !parsed.success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("saving_providers")
      .update({
        display_name: parsed.data.name,
        family: parsed.data.family,
        saving_type: legacySavingTypeForFamily(parsed.data.family),
        icon_key: parsed.data.iconKey,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsedId.data.providerId)
      .eq("household_id", gate.householdId)
      .eq("is_system", false)
      .select(
        "id, provider_key, display_name, saving_type, is_active, metadata, family, icon_key, household_id, is_system",
      )
      .maybeSingle();
    if (error || !data)
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    return { ok: true, value: mapProviderRow(data) };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export async function archiveSavingsProvider(
  providerId: string,
): Promise<SavingsCatalogResult<true>> {
  const parsed = providerIdSchema.safeParse({ providerId });
  if (!parsed.success)
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("saving_providers")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", parsed.data.providerId)
      .eq("household_id", gate.householdId)
      .eq("is_system", false)
      .select("id")
      .maybeSingle();
    if (error || !data)
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    return { ok: true, value: true };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export async function createSavingsProduct(
  raw: unknown,
): Promise<SavingsCatalogResult<SavingPackage>> {
  const parsed = savingsProductInputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  if (
    parsed.data.maxAmount != null &&
    parsed.data.maxAmount < (parsed.data.minAmount ?? 0)
  ) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data: provider } = await supabase
      .from("saving_providers")
      .select("id, family")
      .eq("id", parsed.data.providerId)
      .eq("household_id", gate.householdId)
      .eq("is_system", false)
      .eq("is_active", true)
      .maybeSingle();
    if (!provider)
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    const familyDefaults = defaultTaxConfigForFamily(
      provider.family === "BANK" ? "BANK" : "PLATFORM",
    );
    const taxRule = parsed.data.taxRule;
    const taxRatePercent =
      taxRule === "NONE"
        ? 0
        : parsed.data.taxRatePercent || familyDefaults.ratePercent;
    const { data, error } = await supabase
      .from("saving_packages")
      .insert({
        provider_id: parsed.data.providerId,
        package_name: parsed.data.name,
        duration_days:
          parsed.data.term.unit === "MONTH"
            ? parsed.data.term.amount * 30
            : parsed.data.term.amount,
        term_amount: parsed.data.term.amount,
        term_unit: parsed.data.term.unit,
        annual_interest_rate: parsed.data.annualInterestRatePercent,
        interest_calculation_method: parsed.data.interestCalculationMethod,
        currency: parsed.data.currency,
        tax_rule: taxRule,
        tax_rate_percent: taxRatePercent,
        min_amount: parsed.data.minAmount,
        max_amount: parsed.data.maxAmount,
        settlement_rules: parsed.data.settlementRules,
        early_settlement_rule: parsed.data.earlySettlementRule,
        early_settlement_rate_percent:
          parsed.data.earlySettlementRatePercent ?? null,
        penalty_rules: parsed.data.penaltyRules,
        renewable_available: parsed.data.renewableAvailable,
        supports_partial_settlement: parsed.data.supportsPartialSettlement,
        is_active: true,
      })
      .select(
        "id, provider_id, package_name, duration_days, annual_interest_rate, min_amount, max_amount, settlement_rules, penalty_rules, renewable_available, is_active, term_amount, term_unit, interest_calculation_method, currency, tax_rule, tax_rate_percent, early_settlement_rule, early_settlement_rate_percent, supports_partial_settlement",
      )
      .single();
    if (error || !data)
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    return { ok: true, value: mapPackageRow(data) };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export async function updateSavingsProduct(
  packageId: string,
  raw: unknown,
): Promise<SavingsCatalogResult<SavingPackage>> {
  const parsedId = packageIdSchema.safeParse({ packageId });
  const parsed = savingsProductInputSchema.safeParse(raw);
  if (!parsedId.success || !parsed.success)
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  if (
    parsed.data.maxAmount != null &&
    parsed.data.maxAmount < (parsed.data.minAmount ?? 0)
  ) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data: provider } = await supabase
      .from("saving_providers")
      .select("id, family")
      .eq("id", parsed.data.providerId)
      .eq("household_id", gate.householdId)
      .eq("is_system", false)
      .eq("is_active", true)
      .maybeSingle();
    if (!provider)
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    const familyDefaults = defaultTaxConfigForFamily(
      provider.family === "BANK" ? "BANK" : "PLATFORM",
    );
    const taxRatePercent =
      parsed.data.taxRule === "NONE"
        ? 0
        : parsed.data.taxRatePercent || familyDefaults.ratePercent;
    const { data, error } = await supabase
      .from("saving_packages")
      .update({
        provider_id: parsed.data.providerId,
        package_name: parsed.data.name,
        duration_days:
          parsed.data.term.unit === "MONTH"
            ? parsed.data.term.amount * 30
            : parsed.data.term.amount,
        term_amount: parsed.data.term.amount,
        term_unit: parsed.data.term.unit,
        annual_interest_rate: parsed.data.annualInterestRatePercent,
        interest_calculation_method: parsed.data.interestCalculationMethod,
        currency: parsed.data.currency,
        tax_rule: parsed.data.taxRule,
        tax_rate_percent: taxRatePercent,
        min_amount: parsed.data.minAmount,
        max_amount: parsed.data.maxAmount,
        settlement_rules: parsed.data.settlementRules,
        early_settlement_rule: parsed.data.earlySettlementRule,
        early_settlement_rate_percent:
          parsed.data.earlySettlementRatePercent ?? null,
        penalty_rules: parsed.data.penaltyRules,
        renewable_available: parsed.data.renewableAvailable,
        supports_partial_settlement: parsed.data.supportsPartialSettlement,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsedId.data.packageId)
      .select(
        "id, provider_id, package_name, duration_days, annual_interest_rate, min_amount, max_amount, settlement_rules, penalty_rules, renewable_available, is_active, term_amount, term_unit, interest_calculation_method, currency, tax_rule, tax_rate_percent, early_settlement_rule, early_settlement_rate_percent, supports_partial_settlement",
      )
      .maybeSingle();
    if (error || !data)
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    return { ok: true, value: mapPackageRow(data) };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export async function archiveSavingsProduct(
  packageId: string,
): Promise<SavingsCatalogResult<true>> {
  const parsed = packageIdSchema.safeParse({ packageId });
  if (!parsed.success)
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return { ok: false, code: productActionErrorFromDeniedReason(gate.reason) };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data: packageRow, error: packageError } = await supabase
      .from("saving_packages")
      .select("id, saving_providers!inner(household_id, is_system)")
      .eq("id", parsed.data.packageId)
      .maybeSingle();
    if (packageError || !packageRow) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    const provider = Array.isArray(packageRow.saving_providers)
      ? packageRow.saving_providers[0]
      : packageRow.saving_providers;
    if (
      !provider ||
      provider.is_system ||
      provider.household_id !== gate.householdId
    ) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    const { data, error } = await supabase
      .from("saving_packages")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", parsed.data.packageId)
      .select("id")
      .maybeSingle();
    if (error || !data)
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    return { ok: true, value: true };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
