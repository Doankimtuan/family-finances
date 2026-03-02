import { ArchiveAccountButton } from "@/app/money/_components/archive-account-button";
import { CreateAccountForm } from "@/app/money/_components/create-account-form";
import { CreateAssetForm } from "@/app/assets/_components/create-asset-form";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  formatVnd,
  formatVndCompact,
  formatNumber,
} from "@/lib/dashboard/format";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import {
  Landmark,
  PiggyBank,
  Wallet,
  CreditCard,
  Home,
  Car,
  TrendingUp,
  TrendingDown,
  Coins,
  Banknote,
  Settings,
  Plus,
  ChevronRight,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Tài sản & Nợ | Family Finances",
};

// ─── Types ───────────────────────────────────────────────────────────────────

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
  principal_original: number;
  start_date: string;
  term_months: number | null;
  next_payment_date: string | null;
  promo_rate_annual: number | null;
  floating_rate_margin: number | null;
  lender_name: string | null;
};

type CardSettingsRow = {
  account_id: string;
  credit_limit: number;
  statement_day: number;
  due_day: number;
  linked_bank_account_id: string | null;
};

type RateRow = {
  liability_id: string;
  annual_rate: number;
  period_start: string;
  period_end: string | null;
  is_promotional: boolean;
};

// ─── Helper functions ─────────────────────────────────────────────────────────

function getAccountIcon(type: string) {
  switch (type) {
    case "savings":
      return PiggyBank;
    case "wallet":
      return Wallet;
    default:
      return Landmark;
  }
}

function getAccountColors(type: string) {
  switch (type) {
    case "checking":
      return {
        border: "border-blue-200 dark:border-blue-900/50",
        bg: "bg-blue-50/60 dark:bg-blue-950/20",
        icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/40",
        label: "text-blue-500",
        value: "text-blue-700 dark:text-blue-300",
      };
    case "savings":
      return {
        border: "border-emerald-200 dark:border-emerald-900/50",
        bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
        icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40",
        label: "text-emerald-500",
        value: "text-emerald-700 dark:text-emerald-300",
      };
    case "wallet":
      return {
        border: "border-amber-200 dark:border-amber-900/50",
        bg: "bg-amber-50/60 dark:bg-amber-950/20",
        icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/40",
        label: "text-amber-500",
        value: "text-amber-700 dark:text-amber-300",
      };
    default:
      return {
        border: "border-border",
        bg: "bg-card",
        icon: "bg-primary/10 text-primary",
        label: "text-muted-foreground",
        value: "text-foreground",
      };
  }
}

function getAccountTypeLabel(type: string, vi: boolean) {
  const map: Record<string, [string, string]> = {
    checking: ["Tài khoản thường", "Checking"],
    savings: ["Tiết kiệm", "Savings"],
    wallet: ["Ví điện tử", "Wallet"],
    credit_card: ["Thẻ tín dụng", "Credit Card"],
  };
  const pair = map[type];
  if (!pair) return type.replace(/_/g, " ");
  return vi ? pair[0] : pair[1];
}

function getLiabilityLabel(type: string, vi: boolean) {
  const map: Record<string, [string, string]> = {
    mortgage: ["Vay mua nhà", "Mortgage"],
    personal_loan: ["Vay cá nhân", "Personal Loan"],
    car_loan: ["Vay mua xe", "Car Loan"],
    credit_card: ["Thẻ tín dụng", "Credit Card"],
    family_loan: ["Vay gia đình", "Family Loan"],
    other: ["Khoản vay khác", "Other Loan"],
  };
  const pair = map[type];
  if (!pair) return type.replace(/_/g, " ");
  return vi ? pair[0] : pair[1];
}

function getLiabilityIcon(type: string) {
  switch (type) {
    case "mortgage":
      return Home;
    case "car_loan":
      return Car;
    case "family_loan":
      return MoreHorizontal;
    default:
      return Banknote;
  }
}

function getLiabilityColors(type: string) {
  switch (type) {
    case "mortgage":
      return {
        border: "border-blue-200 dark:border-blue-900/50",
        bg: "bg-blue-50/40 dark:bg-blue-950/20",
      };
    case "car_loan":
      return {
        border: "border-sky-200 dark:border-sky-900/50",
        bg: "bg-sky-50/40 dark:bg-sky-950/20",
      };
    case "family_loan":
      return {
        border: "border-amber-200 dark:border-amber-900/50",
        bg: "bg-amber-50/40 dark:bg-amber-950/20",
      };
    default:
      return { border: "border-border", bg: "bg-card" };
  }
}

function getAssetIcon(cls: string) {
  switch (cls) {
    case "gold":
      return Coins;
    case "real_estate":
      return Home;
    case "vehicle":
      return Car;
    case "mutual_fund":
    case "stock":
    case "crypto":
      return TrendingUp;
    default:
      return TrendingUp;
  }
}

function getAssetColors(cls: string) {
  switch (cls) {
    case "gold":
      return {
        border: "border-yellow-200 dark:border-yellow-900/50",
        bg: "bg-yellow-50/60 dark:bg-yellow-950/20",
        icon: "bg-yellow-100 text-yellow-700",
      };
    case "real_estate":
      return {
        border: "border-sky-200 dark:border-sky-900/50",
        bg: "bg-sky-50/60 dark:bg-sky-950/20",
        icon: "bg-sky-100 text-sky-700",
      };
    case "vehicle":
      return {
        border: "border-blue-200 dark:border-blue-900/50",
        bg: "bg-blue-50/60 dark:bg-blue-950/20",
        icon: "bg-blue-100 text-blue-700",
      };
    case "savings_deposit":
      return {
        border: "border-emerald-200 dark:border-emerald-900/50",
        bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
        icon: "bg-emerald-100 text-emerald-700",
      };
    default:
      return {
        border: "border-teal-200 dark:border-teal-900/50",
        bg: "bg-teal-50/60 dark:bg-teal-950/20",
        icon: "bg-teal-100 text-teal-700",
      };
  }
}

function getAssetClassLabel(cls: string, vi: boolean) {
  const map: Record<string, [string, string]> = {
    gold: ["Vàng", "Gold"],
    real_estate: ["Bất động sản", "Real Estate"],
    vehicle: ["Phương tiện", "Vehicle"],
    savings_deposit: ["Đầu tư", "Investment"],
    mutual_fund: ["Quỹ mở", "Mutual Fund"],
    stock: ["Cổ phiếu", "Stock"],
    crypto: ["Crypto", "Crypto"],
    other: ["Khác", "Other"],
  };
  const pair = map[cls];
  if (!pair) return cls.replace(/_/g, " ");
  return vi ? pair[0] : pair[1];
}

function calcRemainingMonths(
  startDate: string,
  termMonths: number | null,
): number | null {
  if (!termMonths) return null;
  const start = new Date(startDate);
  const now = new Date();
  const elapsed =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  return Math.max(0, termMonths - elapsed);
}

function calcDueDate(
  statementDay: number,
  dueDay: number,
): { label: string; urgent: boolean } {
  const now = new Date();
  let dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (dueDate < now) {
    dueDate = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
  }
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / 86400000);
  const urgent = diffDays <= 3;
  if (diffDays === 0) return { label: "Hôm nay", urgent: true };
  return { label: `${diffDays} ngày nữa`, urgent };
}

// ─── Shared section header with + add action ─────────────────────────────────

function SectionTitle({
  title,
  addHref,
  addLabel,
  addAction,
  total,
}: {
  title: string;
  addHref?: string;
  addLabel?: string;
  addAction?: React.ReactNode;
  total?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {total && (
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            {total}
          </p>
        )}
      </div>
      {addHref ? (
        <Link
          href={addHref}
          className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {addLabel ?? "Thêm"}
        </Link>
      ) : (
        addAction
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MoneyPage() {
  const { householdId, language, householdLocale } =
    await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
  const supabase = await createClient();

  // ── Fetch all data in parallel ──────────────────────────────────────────
  const [accountsResult, liabilitiesResult, assetResult] = await Promise.all([
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
  ]);

  const accounts = (accountsResult.data ?? []) as AccountRow[];
  const liabilities = (liabilitiesResult.data ?? []) as LiabilityRow[];
  const assets = (assetResult.data ?? []) as AssetRow[];

  // ── Credit card settings & billing ──────────────────────────────────────
  const creditCardAccounts = accounts.filter((a) => a.type === "credit_card");
  const creditCardIds = creditCardAccounts.map((a) => a.id);
  const standardAccounts = accounts.filter((a) => a.type !== "credit_card");

  const cardSettingsMap = new Map<string, CardSettingsRow>();
  const cardBillingMap = new Map<
    string,
    { outstanding: number; installmentCount: number; dueDate: string | null }
  >();
  const accountNames = new Map(accounts.map((a) => [a.id, a.name]));

  if (creditCardIds.length > 0) {
    const [
      { data: settingsData },
      { data: billingData },
      { data: installmentData },
    ] = await Promise.all([
      supabase
        .from("credit_card_settings")
        .select(
          "account_id, credit_limit, statement_day, due_day, linked_bank_account_id",
        )
        .in("account_id", creditCardIds),
      supabase
        .from("card_billing_months")
        .select(
          "card_account_id, statement_amount, paid_amount, due_date, status",
        )
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

    // Group billing by card
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
      cardBillingMap.set(id, {
        outstanding,
        installmentCount,
        dueDate: latestDue,
      });
    }
  }

  // ── Standard account balances ────────────────────────────────────────────
  const balanceMap = new Map<string, number>();
  for (const acc of standardAccounts) {
    balanceMap.set(acc.id, Number(acc.opening_balance));
  }
  if (standardAccounts.length > 0) {
    const standardAccountIds = standardAccounts.map((a) => a.id);
    const accountIdList = standardAccountIds.join(",");
    const { data: txRows } = await supabase
      .from("transactions")
      .select("account_id, counterparty_account_id, type, amount")
      .eq("household_id", householdId)
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
  }

  // ── Asset prices (latest + previous for change %) ─────────────────────────
  const priceMap = new Map<string, number>();
  const prevPriceMap = new Map<string, number>();
  const lastUpdatedMap = new Map<string, string>();

  if (assets.length > 0) {
    const { data: priceRows } = await supabase
      .from("asset_price_history")
      .select("asset_id, unit_price, as_of_date")
      .in(
        "asset_id",
        assets.map((a) => a.id),
      )
      .order("as_of_date", { ascending: false });

    // Group rows per asset, pick latest + second-latest
    const byAsset = new Map<
      string,
      { unit_price: number; as_of_date: string }[]
    >();
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
  }

  // ── Rate periods for liabilities ─────────────────────────────────────────
  const rateMap = new Map<string, number>();
  if (liabilities.length > 0) {
    const { data: rateRows } = await supabase
      .from("liability_rate_periods")
      .select(
        "liability_id, annual_rate, period_start, period_end, is_promotional",
      )
      .in(
        "liability_id",
        liabilities.map((l) => l.id),
      )
      .order("period_start", { ascending: false });

    // Pick current active rate
    const today = new Date().toISOString().slice(0, 10);
    for (const row of (rateRows as RateRow[]) ?? []) {
      if (
        !rateMap.has(row.liability_id) &&
        row.period_start <= today &&
        (row.period_end === null || row.period_end >= today)
      ) {
        rateMap.set(row.liability_id, Number(row.annual_rate) * 100);
      }
    }
    // fallback to promo_rate from liability itself
    for (const lib of liabilities) {
      if (!rateMap.has(lib.id) && lib.promo_rate_annual !== null) {
        rateMap.set(lib.id, Number(lib.promo_rate_annual) * 100);
      }
    }
  }

  // ── Summary numbers ──────────────────────────────────────────────────────
  const totalAccountBalance = Array.from(balanceMap.values()).reduce(
    (s, v) => s + v,
    0,
  );
  const totalCardDebt = Array.from(cardBillingMap.values()).reduce(
    (s, v) => s + v.outstanding,
    0,
  );
  const totalAssetValue = assets.reduce(
    (s, a) => s + Number(a.quantity) * (priceMap.get(a.id) ?? 0),
    0,
  );
  const totalLiabilities =
    liabilities.reduce(
      (s, l) => s + Number(l.current_principal_outstanding),
      0,
    ) + totalCardDebt;
  const totalAssets = totalAccountBalance + totalAssetValue;
  const netWorth = totalAssets - totalLiabilities;

  // ─── Render ───────────────────────────────────────────────────────────────

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
      <div className="space-y-8 pb-36 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* ── Hero Net Worth ── */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary to-blue-700 p-7 shadow-xl">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1 relative z-10">
            {vi ? "Tài sản ròng" : "Net Worth"}
          </p>
          <p className="text-4xl font-bold text-white tracking-tight relative z-10">
            {formatVndCompact(netWorth, householdLocale)}
          </p>
          <p className="text-sm text-white/70 mt-0.5 relative z-10">
            {formatVnd(netWorth, householdLocale)}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 relative z-10">
            <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/60">
                {vi ? "Tổng tài sản" : "Total Assets"}
              </p>
              <p className="text-base font-bold text-white mt-1">
                {formatVndCompact(totalAssets, householdLocale)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/60">
                {vi ? "Tổng nợ" : "Total Debt"}
              </p>
              <p className="text-base font-bold text-rose-300 mt-1">
                {formatVndCompact(totalLiabilities, householdLocale)}
              </p>
            </div>
          </div>
        </div>

        {/* ══ 1. TÀI KHOẢN (Accounts) ══ */}
        <section className="space-y-1">
          <SectionTitle
            title={vi ? "Tài Khoản" : "Accounts"}
            total={`${vi ? "Tổng" : "Total"}: ${formatVndCompact(totalAccountBalance, householdLocale)}`}
            addAction={
              <details className="relative group/form">
                <summary className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer list-none">
                  <Plus className="h-4 w-4" />
                  {vi ? "Thêm" : "Add"}
                </summary>
                <div className="absolute right-0 top-8 z-30 w-80 bg-card border border-border rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    {vi ? "Tài khoản mới" : "New Account"}
                  </p>
                  <CreateAccountForm />
                </div>
              </details>
            }
          />

          {standardAccounts.length === 0 ? (
            <EmptyState
              icon={Landmark}
              title={vi ? "Chưa có tài khoản" : "No accounts yet"}
              description={
                vi
                  ? "Thêm tài khoản ngân hàng hoặc ví để bắt đầu."
                  : "Add a bank account or wallet."
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {standardAccounts.map((account) => {
                const balance = balanceMap.get(account.id) ?? 0;
                const colors = getAccountColors(account.type);
                const Icon = getAccountIcon(account.type);
                return (
                  <Card
                    key={account.id}
                    className={cn(
                      "border transition-all duration-200 hover:shadow-md",
                      colors.border,
                      colors.bg,
                    )}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-[9px] font-bold uppercase tracking-wider",
                              colors.label,
                            )}
                          >
                            {getAccountTypeLabel(account.type, vi)}
                          </p>
                          <p className="text-sm font-bold text-foreground truncate mt-0.5">
                            {account.name}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ml-2",
                            colors.icon,
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-xl font-black tracking-tight",
                            colors.value,
                          )}
                        >
                          {formatVndCompact(balance, householdLocale)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatVnd(balance, householdLocale)}
                        </p>
                      </div>
                      <ArchiveAccountButton accountId={account.id} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* ══ 2. THẺ TÍN DỤNG (Credit Cards) ══ */}
        {creditCardAccounts.length > 0 && (
          <section className="space-y-1">
            <SectionTitle
              title={vi ? "Thẻ Tín Dụng" : "Credit Cards"}
              total={
                totalCardDebt > 0
                  ? `${vi ? "Dư nợ" : "Outstanding"}: ${formatVndCompact(totalCardDebt, householdLocale)}`
                  : undefined
              }
              addHref="/money/card/new"
              addLabel={vi ? "Thêm" : "Add"}
            />
            <div className="grid grid-cols-1 gap-4">
              {creditCardAccounts.map((account) => {
                const settings = cardSettingsMap.get(account.id);
                const billing = cardBillingMap.get(account.id);
                const outstanding = billing?.outstanding ?? 0;
                const creditLimit = Number(settings?.credit_limit ?? 0);
                const availableCredit = Math.max(0, creditLimit - outstanding);
                const rawUsage =
                  creditLimit > 0 ? (outstanding / creditLimit) * 100 : 0;
                const usagePercent =
                  outstanding > 0
                    ? Math.max(1, Math.min(100, Math.round(rawUsage)))
                    : 0;
                const usageDisplay =
                  rawUsage > 0 && rawUsage < 1
                    ? rawUsage.toFixed(1)
                    : Math.round(rawUsage).toString();
                const linkedName = settings?.linked_bank_account_id
                  ? accountNames.get(settings.linked_bank_account_id)
                  : null;
                const dueInfo = settings
                  ? calcDueDate(settings.statement_day, settings.due_day)
                  : null;
                const installmentCount = billing?.installmentCount ?? 0;

                return (
                  <Card
                    key={account.id}
                    className="overflow-hidden border-slate-700 bg-linear-to-br from-slate-900 to-slate-800 text-white shadow-lg"
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            {vi ? "Thẻ tín dụng" : "Credit Card"}
                          </p>
                          <p className="text-base font-bold text-white truncate mt-0.5">
                            {account.name}
                          </p>
                          {linkedName && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {vi ? "Liên kết" : "Linked"}: {linkedName}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 h-9 w-9 rounded-xl bg-slate-700/60 flex items-center justify-center">
                          <CreditCard className="h-4.5 w-4.5 text-slate-300" />
                        </div>
                      </div>

                      {/* Balance + limit */}
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">
                            {vi ? "Số dư nợ" : "Outstanding"}
                          </p>
                          <p className="text-2xl font-black text-white tracking-tight mt-0.5">
                            {formatVndCompact(outstanding, householdLocale)}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {vi ? "Hạn mức" : "Limit"}:{" "}
                          <span className="font-bold text-slate-300">
                            {formatVndCompact(creditLimit, householdLocale)}
                          </span>
                        </p>
                      </div>

                      {/* Usage bar */}
                      <div className="space-y-1.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-700",
                              usagePercent > 80
                                ? "bg-rose-500"
                                : usagePercent > 50
                                  ? "bg-amber-500"
                                  : "bg-emerald-500",
                            )}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-400">
                          <span>
                            {vi ? "Còn khả dụng" : "Available"}:{" "}
                            <span className="text-emerald-400">
                              {formatVndCompact(
                                availableCredit,
                                householdLocale,
                              )}
                            </span>
                          </span>
                          <span>
                            {usageDisplay}% {vi ? "sử dụng" : "used"}
                          </span>
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="grid grid-cols-2 gap-x-4">
                          <div>
                            <p className="text-slate-400 font-medium">
                              {vi ? "Hạn thanh toán" : "Due date"}
                            </p>
                            <p
                              className={cn(
                                "font-bold mt-0.5",
                                dueInfo?.urgent
                                  ? "text-rose-400"
                                  : "text-white",
                              )}
                            >
                              {dueInfo?.label ?? "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium">
                              {vi ? "Ngày lập hóa đơn" : "Statement day"}
                            </p>
                            <p className="font-bold text-white mt-0.5">
                              {vi ? "Ngày" : "Day"}{" "}
                              {settings?.statement_day ?? "—"}
                            </p>
                          </div>
                        </div>
                        {installmentCount > 0 && (
                          <span className="text-amber-400 font-bold">
                            {installmentCount}{" "}
                            {vi ? "trả góp đang chạy" : "installments"}
                          </span>
                        )}
                      </div>

                      {/* Action */}
                      <Link
                        href={`/money/card/${account.id}`}
                        className="flex items-center justify-center gap-2 w-full rounded-xl bg-white/10 hover:bg-white/20 transition-colors py-2.5 text-xs font-bold text-white"
                      >
                        {vi ? "Xem chi tiết" : "View Details"}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* ══ 3. KHOẢN VAY (Liabilities) ══ */}
        <section className="space-y-1">
          <SectionTitle
            title={vi ? "Khoản Vay" : "Loans & Debts"}
            total={
              totalLiabilities - totalCardDebt > 0
                ? `${vi ? "Còn nợ" : "Outstanding"}: ${formatVndCompact(totalLiabilities - totalCardDebt, householdLocale)}`
                : undefined
            }
            addHref="/debts"
            addLabel={vi ? "Thêm" : "Add"}
          />
          {liabilities.length === 0 ? (
            <EmptyState
              icon={TrendingDown}
              title={vi ? "Không có khoản vay" : "No active loans"}
              description={
                vi
                  ? "Gia đình đang không có nợ. Tuyệt vời!"
                  : "Your household is debt-free!"
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {liabilities.map((debt) => {
                const outstanding = Number(debt.current_principal_outstanding);
                const original = Number(debt.principal_original);
                const paidPct =
                  original > 0
                    ? Math.round(((original - outstanding) / original) * 100)
                    : 0;
                const remainMonths = calcRemainingMonths(
                  debt.start_date,
                  debt.term_months,
                );
                const rate = rateMap.get(debt.id);
                const LiabilityIcon = getLiabilityIcon(debt.liability_type);
                const colors = getLiabilityColors(debt.liability_type);

                return (
                  <Card
                    key={debt.id}
                    className={cn(
                      "border transition-all duration-200 hover:shadow-md",
                      colors.border,
                      colors.bg,
                    )}
                  >
                    <CardContent className="p-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                            {getLiabilityLabel(debt.liability_type, vi)}
                          </p>
                          <p className="text-sm font-bold text-foreground truncate mt-0.5">
                            {debt.name}
                          </p>
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                          <LiabilityIcon className="h-4.5 w-4.5 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Outstanding */}
                      <div className="flex justify-between items-baseline">
                        <div>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase">
                            {vi ? "Còn nợ" : "Outstanding"}
                          </p>
                          <p className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight mt-0.5">
                            {formatVndCompact(outstanding, householdLocale)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {vi ? "Tổng" : "Total"}:{" "}
                            {formatVndCompact(original, householdLocale)}
                          </p>
                        </div>
                        <Link
                          href={`/debts/${debt.id}`}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                        >
                          {t(language, "common.details")}
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                            style={{ width: `${paidPct}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1 font-medium">
                          {vi ? "Đã trả" : "Repaid"}: {paidPct}%
                        </p>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/50">
                        {rate !== undefined && (
                          <div>
                            <p className="text-[9px] text-muted-foreground font-medium">
                              {vi ? "Lãi suất" : "Interest rate"}
                            </p>
                            <p className="text-sm font-bold text-foreground mt-0.5">
                              {rate.toFixed(1)}%
                            </p>
                          </div>
                        )}
                        {remainMonths !== null && (
                          <div>
                            <p className="text-[9px] text-muted-foreground font-medium">
                              {vi ? "Thời gian còn lại" : "Remaining"}
                            </p>
                            <p className="text-sm font-bold text-foreground mt-0.5">
                              {remainMonths} {vi ? "tháng" : "mo"}
                            </p>
                          </div>
                        )}
                        {debt.next_payment_date && (
                          <div>
                            <p className="text-[9px] text-muted-foreground font-medium">
                              {vi ? "Ngày hoàn tất" : "End date"}
                            </p>
                            <p className="text-sm font-bold text-foreground mt-0.5">
                              {debt.next_payment_date}
                            </p>
                          </div>
                        )}
                        {debt.lender_name && (
                          <div>
                            <p className="text-[9px] text-muted-foreground font-medium">
                              {vi ? "Bên cho vay" : "Lender"}
                            </p>
                            <p className="text-sm font-bold text-foreground mt-0.5 truncate">
                              {debt.lender_name}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* ══ 4. TÀI SẢN (Variable Assets) ══ */}
        <section className="space-y-1">
          <SectionTitle
            title={vi ? "Tài Sản" : "Assets"}
            total={
              totalAssetValue > 0
                ? `${vi ? "Tổng giá trị" : "Total value"}: ${formatVndCompact(totalAssetValue, householdLocale)}`
                : undefined
            }
            addAction={
              <details className="relative group/form">
                <summary className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer list-none">
                  <Plus className="h-4 w-4" />
                  {vi ? "Thêm" : "Add"}
                </summary>
                <div className="absolute right-0 top-8 z-30 w-80 bg-card border border-border rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    {vi ? "Tài sản mới" : "New Asset"}
                  </p>
                  <CreateAssetForm />
                </div>
              </details>
            }
          />

          {assets.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title={vi ? "Chưa có tài sản" : "No assets yet"}
              description={
                vi
                  ? "Thêm vàng, bất động sản, cổ phiếu... để theo dõi danh mục đầu tư."
                  : "Track gold, real estate, stocks, and more."
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {assets.map((asset) => {
                const latestPrice = priceMap.get(asset.id) ?? 0;
                const prevPrice = prevPriceMap.get(asset.id);
                const value = Number(asset.quantity) * latestPrice;
                const changePct =
                  prevPrice && prevPrice > 0
                    ? ((latestPrice - prevPrice) / prevPrice) * 100
                    : null;
                const lastUpdated = lastUpdatedMap.get(asset.id);
                const colors = getAssetColors(asset.asset_class);
                const AssetIcon = getAssetIcon(asset.asset_class);
                const isPositive = changePct !== null && changePct >= 0;

                return (
                  <Link key={asset.id} href={`/assets/${asset.id}`}>
                    <Card
                      className={cn(
                        "border transition-all duration-200 hover:shadow-md h-full",
                        colors.border,
                        colors.bg,
                      )}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                              {getAssetClassLabel(asset.asset_class, vi)}
                            </p>
                            <p className="text-sm font-bold text-foreground truncate mt-0.5">
                              {asset.name}
                            </p>
                          </div>
                          <div
                            className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                              colors.icon,
                            )}
                          >
                            <AssetIcon className="h-4 w-4" />
                          </div>
                        </div>

                        <div>
                          <p className="text-lg font-black text-foreground tracking-tight">
                            {formatVndCompact(value, householdLocale)}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatNumber(
                              Number(asset.quantity),
                              householdLocale,
                            )}{" "}
                            {asset.unit_label}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px]">
                          {changePct !== null ? (
                            <span
                              className={cn(
                                "flex items-center gap-0.5 font-bold",
                                isPositive
                                  ? "text-emerald-600"
                                  : "text-rose-600",
                              )}
                            >
                              {isPositive ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {isPositive ? "+" : ""}
                              {changePct.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {vi ? "Thay đổi" : "Change"}: —
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            {lastUpdated
                              ? new Date(lastUpdated).toLocaleDateString(
                                  householdLocale,
                                  { day: "numeric", month: "short" },
                                )
                              : "—"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ══ 5. Manage all debts link ══ */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="w-full text-muted-foreground hover:text-foreground"
        >
          <Link href="/debts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {vi ? "Quản lý tất cả khoản nợ" : "Manage All Debts"}
          </Link>
        </Button>
      </div>

      {/* ── Sticky Summary Bar ── */}
      <div className="fixed bottom-16 left-0 right-0 z-20 mx-auto max-w-2xl px-4 pb-2 pointer-events-none">
        <div className="pointer-events-auto bg-background/90 backdrop-blur-md border border-border/60 rounded-2xl shadow-lg p-3 grid grid-cols-3 gap-0 text-center">
          <div className="border-r border-border/40">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {vi ? "Tài sản" : "Assets"}
            </p>
            <p className="text-sm font-bold text-success tabular-nums">
              {formatVndCompact(totalAssets, householdLocale)}
            </p>
          </div>
          <div className="border-r border-border/40">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {vi ? "Nợ" : "Debt"}
            </p>
            <p className="text-sm font-bold text-destructive tabular-nums">
              {formatVndCompact(totalLiabilities, householdLocale)}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {vi ? "Ròng" : "Net"}
            </p>
            <p
              className={cn(
                "text-sm font-bold tabular-nums",
                netWorth >= 0 ? "text-primary" : "text-destructive",
              )}
            >
              {formatVndCompact(netWorth, householdLocale)}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
