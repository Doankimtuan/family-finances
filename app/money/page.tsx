import { AccountsSection } from "@/app/money/_components/accounts-section";
import { AssetsSection } from "@/app/money/_components/assets-section";
import { CreditCardsSection } from "@/app/money/_components/credit-cards-section";
import { LiabilitiesSection } from "@/app/money/_components/liabilities-section";
import { NetWorthHero } from "@/app/money/_components/net-worth-hero";
import { SavingsSection } from "@/app/money/_components/savings-section";
import { StickySummaryBar } from "@/app/money/_components/sticky-summary-bar";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { t as dictT } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { Settings } from "lucide-react";
import Link from "next/link";
import {
  buildMoneySummary,
  fetchAccountBalances,
  fetchAssetPrices,
  fetchCardData,
  fetchLiabilityRates,
  fetchMoneyPageData,
} from "./_lib/queries";

export const metadata = {
  title: "Tài sản & Nợ | Family Finances",
};

export default async function MoneyPage() {
  const { householdId, language, householdLocale } =
    await getAuthenticatedHouseholdContext();
  const t = (key: string) => dictT(language, key);
  const supabase = await createClient();

  // ── Step 1: Core data (accounts, assets, liabilities, savings) ────────────
  const {
    accounts,
    liabilities,
    assets,
    savingsSummary,
    featuredSavings,
    activeSavingsCount,
    hiddenSavingsCount,
    savingsGoalOptions,
  } = await fetchMoneyPageData(supabase, householdId);

  const creditCardAccounts = accounts.filter((a) => a.type === "credit_card");
  const creditCardIds = creditCardAccounts.map((a) => a.id);
  const standardAccounts = accounts.filter((a) => a.type !== "credit_card");
  const accountNames = new Map(accounts.map((a) => [a.id, a.name]));

  // ── Step 2: Parallel secondary fetches ────────────────────────────────────
  const [{ cardSettingsMap, cardBillingMap }, balanceMap, { priceMap, prevPriceMap, lastUpdatedMap }, rateMap] =
    await Promise.all([
      fetchCardData(supabase, householdId, creditCardIds),
      fetchAccountBalances(supabase, householdId, accounts),
      fetchAssetPrices(supabase, assets),
      fetchLiabilityRates(supabase, liabilities),
    ]);

  // ── Step 3: Aggregate summary ─────────────────────────────────────────────
  const summary = buildMoneySummary({
    balanceMap,
    cardBillingMap,
    assets,
    priceMap,
    liabilities,
    totalSavingsValue: savingsSummary.totalGrossValue,
  });

  // ── Step 4: Render ────────────────────────────────────────────────────────
  return (
    <AppShell
      header={
        <AppHeader
          title={t("nav.money")}
          subtitle={t("money.summary.total_assets_includes_savings")}
          rightAction={
            <Link
              href="/settings"
              className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-6 w-6" />
              <span className="sr-only">Settings</span>
            </Link>
          }
        />
      }
      footer={<BottomTabBar />}
    >
      <div className="space-y-8 pb-36 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <NetWorthHero summary={summary} />

        <AccountsSection
          standardAccounts={standardAccounts}
          balanceMap={balanceMap}
          totalAccountBalance={summary.totalAccountBalance}
        />

        <SavingsSection
          featuredSavings={featuredSavings}
          hiddenSavingsCount={hiddenSavingsCount}
          activeSavingsCount={activeSavingsCount}
          totalSavingsValue={savingsSummary.totalGrossValue}
          accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
          savingsGoalOptions={savingsGoalOptions}
        />

        <CreditCardsSection
          creditCardAccounts={creditCardAccounts}
          cardSettingsMap={cardSettingsMap}
          cardBillingMap={cardBillingMap}
          accountNames={accountNames}
          totalCardDebt={summary.totalCardDebt}
        />

        <LiabilitiesSection
          liabilities={liabilities}
          rateMap={rateMap}
          totalLiabilities={summary.totalLiabilities}
          totalCardDebt={summary.totalCardDebt}
        />

        <AssetsSection
          assets={assets}
          priceMap={priceMap}
          prevPriceMap={prevPriceMap}
          lastUpdatedMap={lastUpdatedMap}
          totalAssetValue={summary.totalAssetValue}
        />

        <Link
          href="/debts"
          className="mt-6 flex items-center justify-center gap-2 w-full rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 text-sm font-bold shadow-lg hover:opacity-90 transition-all"
        >
          {t("money.liabilities.manage_all")}
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>

      <StickySummaryBar
        totalAssets={summary.totalAssets}
        totalLiabilities={summary.totalLiabilities}
        netWorth={summary.netWorth}
        householdLocale={householdLocale}
        labels={{
          assets: t("assets.title"),
          debt: t("common.debt"),
          net: t("common.net"),
        }}
      />
    </AppShell>
  );
}
