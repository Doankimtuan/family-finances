import { Suspense } from "react";
import { AccountsSection } from "./_components/accounts-section";
import { AssetsSection } from "./_components/assets-section";
import { CreditCardsSection } from "./_components/credit-cards-section";
import { NetWorthHero } from "./_components/net-worth-hero";
import { SavingsSection } from "./_components/savings-section";
import { StickySummaryBar } from "./_components/sticky-summary-bar";
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
  fetchMoneyPageData,
} from "./_lib/queries";
import { DebtsSection } from "./_components/debts-section";

export const metadata = {
  title: "Accounts | Family Finances",
};

export default async function AccountsPage() {
  const { householdId, language, householdLocale } =
    await getAuthenticatedHouseholdContext();
  const t = (key: string) => dictT(language, key);
  const supabase = await createClient();

  // ── Step 1: Core data ────────────────────────────────────────────────────
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

  // ── Step 2: Parallel secondary fetches ───────────────────────────────────
  const [
    { cardSettingsMap, cardBillingMap },
    balanceMap,
    { priceMap, prevPriceMap, lastUpdatedMap },
  ] = await Promise.all([
    fetchCardData(supabase, householdId, creditCardIds),
    fetchAccountBalances(supabase, householdId, accounts),
    fetchAssetPrices(supabase, assets),
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
          title={t("nav.accounts")}
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

        <AssetsSection
          assets={assets}
          priceMap={priceMap}
          prevPriceMap={prevPriceMap}
          lastUpdatedMap={lastUpdatedMap}
          totalAssetValue={summary.totalAssetValue}
        />

        <Suspense fallback={null}>
          <DebtsSection
            householdId={householdId}
            householdLocale={householdLocale}
            language={language}
          />
        </Suspense>
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
