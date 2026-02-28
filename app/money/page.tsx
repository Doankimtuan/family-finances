import { ArchiveAccountButton } from "@/app/money/_components/archive-account-button";
import { CreateAccountForm } from "@/app/money/_components/create-account-form";
import { CreateAssetForm } from "@/app/assets/_components/create-asset-form";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatNumber,
  formatVnd,
  formatVndCompact,
} from "@/lib/dashboard/format";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import {
  Landmark,
  Building2,
  Settings,
  TrendingUp,
  PiggyBank,
  TrendingDown as TrendingDownIcon,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Assets & Accounts | Family Finances",
};

type AccountRow = {
  id: string;
  name: string;
  type: string;
  opening_balance: number;
};

type AssetRow = {
  id: string;
  name: string;
  asset_class: string;
  unit_label: string;
  quantity: number;
  is_liquid: boolean;
};

type LiabilityRow = {
  id: string;
  name: string;
  liability_type: string;
  current_principal_outstanding: number;
};

type CardSettingsRow = {
  account_id: string;
  credit_limit: number;
  statement_day: number;
};

export default async function MoneyPage() {
  const { householdId, language, householdLocale } =
    await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
  const supabase = await createClient();

  // Fetch Accounts
  const accountsResult = await supabase
    .from("accounts")
    .select("id, name, type, opening_balance")
    .eq("household_id", householdId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  const accounts = (accountsResult.data ?? []) as AccountRow[];

  // Fetch credit card settings for limit display
  const creditCardIds = accounts
    .filter((a) => a.type === "credit_card")
    .map((a) => a.id);
  const cardSettingsMap = new Map<string, CardSettingsRow>();
  if (creditCardIds.length > 0) {
    const { data: settingsData } = await supabase
      .from("credit_card_settings")
      .select("account_id, credit_limit, statement_day")
      .in("account_id", creditCardIds);
    for (const s of settingsData ?? []) {
      cardSettingsMap.set(s.account_id, s as CardSettingsRow);
    }
  }

  // Fetch Account Transactions for standard balance
  const txResult = accounts.length
    ? await supabase
        .from("transactions")
        .select("account_id, type, amount")
        .eq("household_id", householdId)
        .in(
          "account_id",
          accounts.map((account) => account.id),
        )
    : { data: [] };

  // Fetch Credit Card Billing status for credit card balance
  const cardBillingResult = await supabase
    .from("card_billing_months")
    .select("card_account_id, statement_amount, paid_amount")
    .eq("household_id", householdId)
    .neq("status", "settled");

  const balanceMap = new Map<string, number>();
  const cardOutstandingMap = new Map<string, number>();

  // Initialize maps
  for (const account of accounts) {
    if (account.type === "credit_card") {
      cardOutstandingMap.set(account.id, 0);
    } else {
      balanceMap.set(account.id, Number(account.opening_balance));
    }
  }

  // Calculate standard account balances
  for (const row of txResult.data ?? []) {
    if (!balanceMap.has(row.account_id)) continue;
    const current = balanceMap.get(row.account_id) ?? 0;
    const delta =
      row.type === "income"
        ? Number(row.amount)
        : row.type === "expense"
          ? -Number(row.amount)
          : 0;
    balanceMap.set(row.account_id, current + delta);
  }

  // Calculate credit card outstanding totals
  for (const row of cardBillingResult.data ?? []) {
    const current = cardOutstandingMap.get(row.card_account_id) ?? 0;
    const unpaid = Number(row.statement_amount) - Number(row.paid_amount);
    cardOutstandingMap.set(row.card_account_id, current + unpaid);
  }

  // Final merge for UI (using absolute values for display on account list if needed,
  // but for CC we show the debt as positive in the account row usually, or we can use negative).
  // Let's use positive value for 'debt' shown in CC account list row.
  for (const [id, val] of cardOutstandingMap.entries()) {
    balanceMap.set(id, val);
  }

  // Fetch Assets
  const assetResult = await supabase
    .from("assets")
    .select("id, name, asset_class, unit_label, quantity, is_liquid")
    .eq("household_id", householdId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  const assets = (assetResult.data ?? []) as AssetRow[];

  // Fetch Asset Prices
  const priceMap = new Map<string, number>();
  if (assets.length > 0) {
    const priceRows = await supabase
      .from("asset_price_history")
      .select("asset_id, unit_price, as_of_date")
      .in(
        "asset_id",
        assets.map((asset) => asset.id),
      )
      .order("as_of_date", { ascending: false });

    for (const row of priceRows.data ?? []) {
      if (!priceMap.has(row.asset_id)) {
        priceMap.set(row.asset_id, Number(row.unit_price));
      }
    }
  }

  // Fetch Liabilities
  const liabilitiesResult = await supabase
    .from("liabilities")
    .select("id, name, liability_type, current_principal_outstanding")
    .eq("household_id", householdId)
    .eq("is_active", true)
    .order("current_principal_outstanding", { ascending: false });

  const liabilities = (liabilitiesResult.data ?? []) as LiabilityRow[];

  // Total Credit Card Debt
  const totalCardDebt = Array.from(cardOutstandingMap.values()).reduce(
    (s, v) => s + v,
    0,
  );

  // Grouping
  const fixedAssets = assets.filter((a) => a.asset_class === "savings_deposit");
  const variableAssets = assets.filter(
    (a) => a.asset_class !== "savings_deposit",
  );

  // Sums
  // Standard Account Balances (exclude CC-debt accounts from the 'asset' side)
  const standardAccountIds = accounts
    .filter((a) => a.type !== "credit_card")
    .map((a) => a.id);

  const totalAccountBalance = Array.from(balanceMap.entries())
    .filter(([id]) => standardAccountIds.includes(id))
    .reduce((sum, [, b]) => sum + b, 0);

  const totalFixedAssetsValue = fixedAssets.reduce(
    (sum, a) => sum + Number(a.quantity) * (priceMap.get(a.id) ?? 0),
    0,
  );
  const totalVariableAssetsValue = variableAssets.reduce(
    (sum, a) => sum + Number(a.quantity) * (priceMap.get(a.id) ?? 0),
    0,
  );

  const totalFixed = totalAccountBalance + totalFixedAssetsValue;
  const totalVariable = totalVariableAssetsValue;
  const totalAssets = totalFixed + totalVariable;

  const totalLiabilities = liabilities.reduce(
    (sum, l) => sum + Number(l.current_principal_outstanding),
    totalCardDebt,
  );
  const netWorth = totalAssets - totalLiabilities;

  return (
    <AppShell
      header={
        <AppHeader
          title={vi ? "Tài sản" : "Assets"}
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
      <div className="space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section className="w-full">
          <MetricCard
            label={vi ? "Tài sản ròng (Net Worth)" : "Net Worth"}
            value={formatVndCompact(netWorth, householdLocale)}
            icon={Building2}
            variant="default"
          />
        </section>

        {/* FIXED ASSETS */}
        <section className="space-y-4">
          <SectionHeader
            label="Fixed"
            title={
              vi ? "Tài sản thanh khoản / Cố định" : "Fixed & Liquid Assets"
            }
            description={
              vi
                ? "Tiền mặt, tài khoản ngân hàng và các khoản tiết kiệm."
                : "Cash, bank accounts, and savings deposits."
            }
          />

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3 border-b border-primary/10">
              <h3 className="font-semibold text-sm text-foreground flex justify-between items-center">
                <span>{vi ? "Thêm mới" : "Add New"}</span>
              </h3>
            </CardHeader>
            <CardContent className="pt-4  gap-4">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">
                  {vi ? "Ngân hàng & Ví" : "Bank & Wallet"}
                </h4>
                <CreateAccountForm />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            <h4 className="text-sm font-semibold text-muted-foreground border-b border-border/50 pb-2">
              {vi ? "Ngân hàng & Tiền mặt" : "Bank & Cash"}
            </h4>
            {accounts.map((account) => {
              const balance = balanceMap.get(account.id) ?? 0;
              const isCard = account.type === "credit_card";
              const cardSettings = isCard
                ? cardSettingsMap.get(account.id)
                : undefined;
              const creditLimit = Number(cardSettings?.credit_limit ?? 0);
              const availableCredit = Math.max(0, creditLimit - balance);
              const rawUsage =
                creditLimit > 0 ? (balance / creditLimit) * 100 : 0;
              // Show 1 decimal place for <1%, integer for larger
              const usageDisplay =
                rawUsage > 0 && rawUsage < 1
                  ? rawUsage.toFixed(1)
                  : Math.round(rawUsage).toString();
              // For bar width: minimum 1% if there is any balance, so bar is always visible
              const usagePercent =
                balance > 0
                  ? Math.max(1, Math.min(100, Math.round(rawUsage)))
                  : 0;

              if (isCard) {
                return (
                  <Card
                    key={account.id}
                    className="overflow-hidden border-rose-200 bg-linear-to-br from-rose-50 to-white transition-all duration-300 hover:border-rose-300 hover:shadow-md"
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                            <CreditCard className="h-5 w-5 text-rose-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-foreground">
                              {account.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className="mt-1 text-[10px] uppercase font-bold text-rose-700 border-rose-200 bg-rose-50"
                            >
                              Thẻ tín dụng
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-rose-600">
                            -{formatVnd(balance, householdLocale)}
                          </p>
                          {creditLimit > 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              / {formatVndCompact(creditLimit, householdLocale)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Usage bar */}
                      {creditLimit > 0 && (
                        <div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>
                              {vi ? "Còn khả dụng" : "Available"}:{" "}
                              <span className="font-bold text-emerald-600">
                                {formatVndCompact(
                                  availableCredit,
                                  householdLocale,
                                )}
                              </span>
                            </span>
                            <span>{usageDisplay}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-rose-100">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                usagePercent > 80
                                  ? "bg-rose-500"
                                  : usagePercent > 50
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          href={`/money/card/${account.id}`}
                          className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-center text-xs font-bold text-white hover:bg-rose-700 transition-colors"
                        >
                          {vi ? "Thanh toán & Quản lý thẻ" : "Manage Card"}
                        </Link>
                        <ArchiveAccountButton accountId={account.id} />
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card
                  key={account.id}
                  className="group hover:border-primary/30 transition-all duration-300"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                          <Landmark className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-foreground">
                            {account.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase font-bold bg-muted/20"
                            >
                              {account.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-primary">
                          {formatVnd(balance, householdLocale)}
                        </p>
                        <div className="flex flex-col items-end gap-1 mt-1">
                          <ArchiveAccountButton accountId={account.id} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {accounts.length === 0 && (
              <p className="text-sm text-muted-foreground py-2 italic">
                {vi ? "Chưa có tài khoản nào." : "No accounts yet."}
              </p>
            )}

            {fixedAssets.length > 0 && (
              <>
                <h4 className="text-sm font-semibold text-muted-foreground border-b border-border/50 pb-2 mt-4">
                  {vi ? "Tiết kiệm có kỳ hạn" : "Savings Deposits"}
                </h4>
                {fixedAssets.map((asset) => {
                  const qty = Number(asset.quantity);
                  const price = priceMap.get(asset.id) ?? 0;
                  const value = qty * price;
                  return (
                    <Card
                      key={asset.id}
                      className="group hover:border-primary/30 transition-all duration-300"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 group-hover:bg-orange-100 transition-colors">
                              <PiggyBank className="h-5 w-5 text-orange-600 transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-bold text-foreground">
                                {asset.name}
                              </h3>
                              <div className="mt-1 flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] uppercase font-bold text-orange-700 border-orange-200 bg-orange-50"
                                >
                                  {vi ? "Tiết kiệm" : "Savings"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-foreground">
                              {formatVnd(value, householdLocale)}
                            </p>
                            <Button
                              variant="link"
                              size="sm"
                              asChild
                              className="h-auto p-0 text-muted-foreground"
                            >
                              <Link href={`/assets/${asset.id}`}>
                                {t(language, "common.details")}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            )}
          </div>
        </section>

        {/* VARIABLE ASSETS */}
        <section className="space-y-4">
          <SectionHeader
            label="Variable"
            title={vi ? "Tài sản biến động" : "Variable Assets"}
            description={
              vi
                ? "Đầu tư, vàng, chứng chỉ quỹ, bất động sản, crypto..."
                : "Investments, gold, funds, crypto, real estate..."
            }
          />

          <Card className="border-teal-200 bg-teal-50">
            <CardHeader className="pb-3 border-b border-teal-100">
              <h3 className="font-semibold text-sm text-teal-900 flex justify-between items-center">
                <span>{vi ? "Thêm hình thức đầu tư" : "Add Investment"}</span>
              </h3>
            </CardHeader>
            <CardContent className="pt-4">
              <CreateAssetForm />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {variableAssets.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title={vi ? "Chưa có tài sản biến động" : "No variable assets"}
                description={
                  vi
                    ? "Ghi nhận vàng, chứng chỉ quỹ hoặc cổ phiếu để theo dõi đầu tư."
                    : "Track gold, funds, or stocks here."
                }
              />
            ) : (
              variableAssets.map((asset) => {
                const latestPrice = priceMap.get(asset.id) ?? 0;
                const value = Number(asset.quantity) * latestPrice;
                const assetClassLabel =
                  asset.asset_class === "gold"
                    ? vi
                      ? "Vàng"
                      : "Gold"
                    : asset.asset_class === "mutual_fund"
                      ? vi
                        ? "Quỹ mở"
                        : "Mutual fund"
                      : asset.asset_class === "real_estate"
                        ? vi
                          ? "Bất động sản"
                          : "Real estate"
                        : asset.asset_class === "stock"
                          ? vi
                            ? "Cổ phiếu"
                            : "Stock"
                          : asset.asset_class === "crypto"
                            ? t(language, "assets.crypto")
                            : asset.asset_class === "other"
                              ? vi
                                ? "Khác"
                                : "Other"
                              : asset.asset_class.replace(/_/g, " ");

                return (
                  <Card
                    key={asset.id}
                    className="group hover:border-teal-300 transition-all duration-300 border-border bg-white"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {asset.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {assetClassLabel}
                          </p>
                          <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-lg font-semibold text-slate-900">
                              {formatVnd(value, householdLocale)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {formatNumber(
                                Number(asset.quantity),
                                householdLocale,
                              )}{" "}
                              {asset.unit_label}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="shrink-0 bg-white"
                        >
                          <Link href={`/assets/${asset.id}`}>
                            {t(language, "common.details")}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        {/* DEBTS / LIABILITIES */}
        <section className="space-y-4">
          <SectionHeader
            label="Liabilities"
            title={vi ? "Khoản nợ & Nghĩa vụ" : "Debts & Liabilities"}
            description={
              vi
                ? "Các khoản vay ngân hàng, nợ thẻ tín dụng và vay người thân."
                : "Bank loans, credit card debt, and family loans."
            }
          />

          <div className="grid grid-cols-1 gap-4">
            {liabilities.length === 0 ? (
              <EmptyState
                icon={TrendingDownIcon}
                title={vi ? "Không có khoản nợ nào" : "No active debts"}
                description={
                  vi
                    ? "Gia đình bạn đang không có nợ. Hãy tiếp tục duy trì nhé!"
                    : "Your household is currently debt-free. Keep it up!"
                }
              />
            ) : (
              liabilities.map((debt) => {
                const liabilityTypeLabel =
                  debt.liability_type === "family_loan"
                    ? vi
                      ? "Vay gia đình"
                      : "Family loan"
                    : debt.liability_type === "credit_card"
                      ? vi
                        ? "Thẻ tín dụng"
                        : "Credit card"
                      : debt.liability_type.replace(/_/g, " ");

                return (
                  <Card
                    key={debt.id}
                    className="group hover:border-rose-300 transition-all duration-300 border-border bg-white"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {debt.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {liabilityTypeLabel}
                          </p>
                          <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-lg font-semibold text-rose-600">
                              {formatVnd(
                                Number(debt.current_principal_outstanding),
                                householdLocale,
                              )}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="shrink-0 bg-white"
                        >
                          <Link href={`/debts/${debt.id}`}>
                            {t(language, "common.details")}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="w-full text-muted-foreground hover:text-foreground"
              >
                <Link href="/debts" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {vi ? "Quản lý tất cả khoản nợ" : "Manage All Debts"}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
