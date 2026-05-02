/**
 * Server-side data fetching for the Money page.
 * All functions accept a Supabase client + householdId and return typed data.
 * Never import from here in Client Components.
 */
import {
  buildFeaturedSavingsItems,
  buildSavingsListItems,
  buildSavingsSummary,
  fetchSavingsBundle,
} from "@/lib/savings/service";
import { createClient } from "@/lib/supabase/server";
import type {
  AccountRow,
  AssetRow,
  CardBillingInfo,
  CardSettingsRow,
  LiabilityRow,
  MoneySummary,
  RateRow,
} from "./types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// ─── Core data fetch ────────────────────────────────────────────────────────

export async function fetchMoneyPageData(
  supabase: SupabaseClient,
  householdId: string,
) {
  const today = new Date().toISOString().slice(0, 10);

  const [accountsResult, liabilitiesResult, assetResult, savingsBundle] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("id, name, type, opening_balance")
        .eq("household_id", householdId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false }),
      supabase
        .from("liabilities")
        .select(
          "id, name, liability_type, current_principal_outstanding, principal_original, start_date, term_months, next_payment_date, promo_rate_annual, floating_rate_margin, lender_name",
        )
        .eq("household_id", householdId)
        .eq("is_active", true)
        .order("current_principal_outstanding", { ascending: false }),
      supabase
        .from("assets")
        .select("id, name, asset_class, unit_label, quantity, is_liquid")
        .eq("household_id", householdId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false }),
      fetchSavingsBundle(supabase, householdId),
    ]);

  const accounts = (accountsResult.data ?? []) as AccountRow[];
  const liabilities = (liabilitiesResult.data ?? []) as LiabilityRow[];
  const assets = (assetResult.data ?? []) as AssetRow[];
  const savingsItems = buildSavingsListItems(
    savingsBundle.accounts,
    savingsBundle.withdrawals,
    savingsBundle.goals,
    today,
  );
  const savingsSummary = buildSavingsSummary(savingsItems);
  const featuredSavings = buildFeaturedSavingsItems(savingsItems, 3);
  const activeSavingsCount = savingsItems.filter(
    (item) => item.status !== "withdrawn" && item.status !== "cancelled",
  ).length;
  const hiddenSavingsCount = Math.max(activeSavingsCount - featuredSavings.length, 0);
  const savingsGoalOptions = Array.from(savingsBundle.goals.entries()).map(
    ([id, name]) => ({ id, name }),
  );

  return {
    accounts,
    liabilities,
    assets,
    savingsSummary,
    featuredSavings,
    activeSavingsCount,
    hiddenSavingsCount,
    savingsGoalOptions,
  };
}

// ─── Credit card settings + billing ────────────────────────────────────────

export async function fetchCardData(
  supabase: SupabaseClient,
  householdId: string,
  creditCardIds: string[],
): Promise<{
  cardSettingsMap: Map<string, CardSettingsRow>;
  cardBillingMap: Map<string, CardBillingInfo>;
}> {
  const cardSettingsMap = new Map<string, CardSettingsRow>();
  const cardBillingMap = new Map<string, CardBillingInfo>();

  if (creditCardIds.length === 0) return { cardSettingsMap, cardBillingMap };

  const [{ data: settingsData }, { data: billingData }, { data: installmentData }] =
    await Promise.all([
      supabase
        .from("credit_card_settings")
        .select("account_id, credit_limit, statement_day, due_day, linked_bank_account_id")
        .in("account_id", creditCardIds),
      supabase
        .from("card_billing_months")
        .select("card_account_id, statement_amount, paid_amount, due_date, status")
        .eq("household_id", householdId)
        .neq("status", "settled"),
      supabase
        .from("installment_plans")
        .select("card_account_id, status")
        .eq("household_id", householdId)
        .eq("status", "active"),
    ]);

  for (const s of settingsData ?? []) {
    cardSettingsMap.set(s.account_id, s as CardSettingsRow);
  }

  for (const id of creditCardIds) {
    const rows = (billingData ?? []).filter((r) => r.card_account_id === id);
    const outstanding = rows.reduce(
      (s, r) => s + (Number(r.statement_amount) - Number(r.paid_amount)),
      0,
    );
    const latestDue =
      rows
        .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
        .at(-1)?.due_date ?? null;
    const installmentCount = (installmentData ?? []).filter(
      (p) => p.card_account_id === id,
    ).length;
    cardBillingMap.set(id, { outstanding, installmentCount, dueDate: latestDue });
  }

  return { cardSettingsMap, cardBillingMap };
}

// ─── Account balances (standard accounts only) ──────────────────────────────

export async function fetchAccountBalances(
  supabase: SupabaseClient,
  householdId: string,
  accounts: AccountRow[],
): Promise<Map<string, number>> {
  const balanceMap = new Map<string, number>();
  const standardAccounts = accounts.filter((a) => a.type !== "credit_card");

  for (const acc of standardAccounts) {
    balanceMap.set(acc.id, Number(acc.opening_balance));
  }

  if (standardAccounts.length === 0) return balanceMap;

  const standardAccountIds = standardAccounts.map((a) => a.id);
  const accountIdList = standardAccountIds.join(",");
  const { data: txRows } = await supabase
    .from("transactions")
    .select("account_id, counterparty_account_id, type, amount")
    .eq("household_id", householdId)
    .eq("is_non_cash", false)
    .or(
      `account_id.in.(${accountIdList}),counterparty_account_id.in.(${accountIdList})`,
    );

  for (const row of txRows ?? []) {
    const amount = Number(row.amount ?? 0);
    const sourceId = row.account_id;
    const targetId = row.counterparty_account_id;

    if (row.type === "income" && sourceId && balanceMap.has(sourceId)) {
      balanceMap.set(sourceId, (balanceMap.get(sourceId) ?? 0) + amount);
    }
    if (row.type === "expense" && sourceId && balanceMap.has(sourceId)) {
      balanceMap.set(sourceId, (balanceMap.get(sourceId) ?? 0) - amount);
    }
    if (row.type === "transfer") {
      if (sourceId && balanceMap.has(sourceId)) {
        balanceMap.set(sourceId, (balanceMap.get(sourceId) ?? 0) - amount);
      }
      if (targetId && balanceMap.has(targetId)) {
        balanceMap.set(targetId, (balanceMap.get(targetId) ?? 0) + amount);
      }
    }
  }

  return balanceMap;
}

// ─── Asset prices (latest + previous) ──────────────────────────────────────

export async function fetchAssetPrices(
  supabase: SupabaseClient,
  assets: AssetRow[],
): Promise<{
  priceMap: Map<string, number>;
  prevPriceMap: Map<string, number>;
  lastUpdatedMap: Map<string, string>;
}> {
  const priceMap = new Map<string, number>();
  const prevPriceMap = new Map<string, number>();
  const lastUpdatedMap = new Map<string, string>();

  if (assets.length === 0) return { priceMap, prevPriceMap, lastUpdatedMap };

  const { data: priceRows } = await supabase
    .from("asset_price_history")
    .select("asset_id, unit_price, as_of_date")
    .in("asset_id", assets.map((a) => a.id))
    .order("as_of_date", { ascending: false });

  const byAsset = new Map<string, { unit_price: number; as_of_date: string }[]>();
  for (const row of priceRows ?? []) {
    if (!byAsset.has(row.asset_id)) byAsset.set(row.asset_id, []);
    byAsset.get(row.asset_id)!.push(row);
  }
  for (const [assetId, rows] of byAsset) {
    if (rows[0]) {
      priceMap.set(assetId, Number(rows[0].unit_price));
      lastUpdatedMap.set(assetId, rows[0].as_of_date);
    }
    if (rows[1]) prevPriceMap.set(assetId, Number(rows[1].unit_price));
  }

  return { priceMap, prevPriceMap, lastUpdatedMap };
}

// ─── Liability rate periods ─────────────────────────────────────────────────

export async function fetchLiabilityRates(
  supabase: SupabaseClient,
  liabilities: LiabilityRow[],
): Promise<Map<string, number>> {
  const rateMap = new Map<string, number>();
  if (liabilities.length === 0) return rateMap;

  const today = new Date().toISOString().slice(0, 10);
  const { data: rateRows } = await supabase
    .from("liability_rate_periods")
    .select("liability_id, annual_rate, period_start, period_end, is_promotional")
    .in("liability_id", liabilities.map((l) => l.id))
    .order("period_start", { ascending: false });

  for (const row of (rateRows as RateRow[]) ?? []) {
    if (
      !rateMap.has(row.liability_id) &&
      row.period_start <= today &&
      (row.period_end === null || row.period_end >= today)
    ) {
      rateMap.set(row.liability_id, Number(row.annual_rate) * 100);
    }
  }
  // Fallback to promo_rate from liability record
  for (const lib of liabilities) {
    if (!rateMap.has(lib.id) && lib.promo_rate_annual !== null) {
      rateMap.set(lib.id, Number(lib.promo_rate_annual) * 100);
    }
  }

  return rateMap;
}

// ─── Summary aggregation ────────────────────────────────────────────────────

export function buildMoneySummary({
  balanceMap,
  cardBillingMap,
  assets,
  priceMap,
  liabilities,
  totalSavingsValue,
}: {
  balanceMap: Map<string, number>;
  cardBillingMap: Map<string, CardBillingInfo>;
  assets: AssetRow[];
  priceMap: Map<string, number>;
  liabilities: LiabilityRow[];
  totalSavingsValue: number;
}): MoneySummary {
  const totalAccountBalance = Array.from(balanceMap.values()).reduce((s, v) => s + v, 0);
  const totalCardDebt = Array.from(cardBillingMap.values()).reduce(
    (s, v) => s + v.outstanding,
    0,
  );
  const totalAssetValue = assets.reduce(
    (s, a) => s + Number(a.quantity) * (priceMap.get(a.id) ?? 0),
    0,
  );
  const totalLiabilities =
    liabilities.reduce((s, l) => s + Number(l.current_principal_outstanding), 0) +
    totalCardDebt;
  const totalAssets = totalAccountBalance + totalSavingsValue + totalAssetValue;
  const netWorth = totalAssets - totalLiabilities;

  return {
    totalAccountBalance,
    totalCardDebt,
    totalAssetValue,
    totalSavingsValue,
    totalLiabilities,
    totalAssets,
    netWorth,
  };
}
