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

  // Fetch Account Transactions for balance
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

  const balanceMap = new Map<string, number>();
  for (const account of accounts) {
    balanceMap.set(account.id, Number(account.opening_balance));
  }
  for (const row of txResult.data ?? []) {
    const current = balanceMap.get(row.account_id) ?? 0;
    const delta =
      row.type === "income"
        ? Number(row.amount)
        : row.type === "expense"
          ? -Number(row.amount)
          : 0;
    balanceMap.set(row.account_id, current + delta);
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

  // Grouping
  const fixedAssets = assets.filter((a) => a.asset_class === "savings_deposit");
  const variableAssets = assets.filter(
    (a) => a.asset_class !== "savings_deposit",
  );

  // Sums
  const totalAccountBalance = Array.from(balanceMap.values()).reduce(
    (sum, b) => sum + b,
    0,
  );
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
  const totalWealth = totalFixed + totalVariable;

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
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricCard
            label={vi ? "Tổng tài sản ròng" : "Total Net Assets"}
            value={formatVndCompact(totalWealth, householdLocale)}
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
                        <ArchiveAccountButton accountId={account.id} />
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
      </div>
    </AppShell>
  );
}
