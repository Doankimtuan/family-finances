import Link from "next/link";
import { DetailedTransactionForm } from "./detailed-transaction-form";
import { QuickAddForm } from "./quick-add-form";
import { TransactionsList } from "./transactions-list";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  History,
  Landmark,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Repeat,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatVndCompact } from "@/lib/dashboard/format";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { t } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";
import {
  TRANSACTION_HISTORY_LIMIT,
  TRANSACTION_QUERY_LIMIT,
  QUICK_CATEGORIES_COUNT,
  SAVINGS_PRINCIPAL_WITHDRAWAL,
  SAVINGS_PRINCIPAL_DEPOSIT,
} from "../_constants";

export async function TransactionsContent({
  householdId,
}: {
  householdId: string;
}) {
  const supabase = await createClient();
  const { householdLocale, language } = await getAuthenticatedHouseholdContext();

  const [accountsResult, categoriesResult, transactionsResult] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("id, name")
        .eq("household_id", householdId)
        .eq("is_archived", false)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("categories")
        .select("id, name, kind")
        .or(`household_id.is.null,household_id.eq.${householdId}`)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("transactions")
        .select(
          "id, type, amount, transaction_date, description, category_id, account_id, counterparty_account_id, paid_by_member_id, transaction_subtype, is_non_cash, created_at",
        )
        .eq("household_id", householdId)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(TRANSACTION_QUERY_LIMIT),
    ]);

  const accounts = accountsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const memberIds = Array.from(
    new Set(
      (transactionsResult.data ?? [])
        .map((tx) => tx.paid_by_member_id)
        .filter(Boolean),
    ),
  );
  const profilesResult = memberIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", memberIds)
    : { data: [], error: null };
  const profileMap = new Map(
    (profilesResult.data ?? []).map((p) => [p.user_id, p.full_name]),
  );

  const listItems = (transactionsResult.data ?? []).map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: Number(tx.amount),
    transaction_date: tx.transaction_date,
    description: tx.description,
    category_id: tx.category_id,
    account_id: tx.account_id,
    counterparty_account_id: tx.counterparty_account_id,
    category_name: tx.category_id
      ? (categoryMap.get(tx.category_id) ?? null)
      : null,
    account_name: tx.account_id
      ? (accountMap.get(tx.account_id) ?? null)
      : null,
    counterparty_account_name: tx.counterparty_account_id
      ? (accountMap.get(tx.counterparty_account_id) ?? null)
      : null,
    member_name: tx.paid_by_member_id
      ? (profileMap.get(tx.paid_by_member_id) ?? null)
      : null,
    transaction_subtype:
      "transaction_subtype" in tx ? (tx.transaction_subtype as string | null) : null,
    is_non_cash: "is_non_cash" in tx ? Boolean(tx.is_non_cash) : false,
  }));
  const historyItems = listItems.slice(0, TRANSACTION_HISTORY_LIMIT);
  const historyHasMore = (transactionsResult.data ?? []).length > TRANSACTION_HISTORY_LIMIT;
  const lastHistoryRow = transactionsResult.data?.[historyItems.length - 1];
  const historyNextCursor =
    historyHasMore && lastHistoryRow
      ? `${lastHistoryRow.transaction_date}|${lastHistoryRow.created_at}`
      : null;

  const quickCategories = categories
    .filter((category) => category.kind === "expense")
    .slice(0, QUICK_CATEGORIES_COUNT)
    .map((category) => ({ id: category.id, name: category.name }));

  // ── Monthly summary (current calendar month) ──────────────────────────
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthItems = listItems.filter(
    (tx) => tx.transaction_date >= monthStart,
  );
  const monthIncome = monthItems
    .filter(
      (tx) =>
        tx.type === "income" &&
        tx.transaction_subtype !== SAVINGS_PRINCIPAL_WITHDRAWAL &&
        !tx.is_non_cash,
    )
    .reduce((s, tx) => s + tx.amount, 0);
  const monthExpense = monthItems
    .filter(
      (tx) =>
        tx.type === "expense" &&
        tx.transaction_subtype !== SAVINGS_PRINCIPAL_DEPOSIT &&
        !tx.is_non_cash,
    )
    .reduce((s, tx) => s + tx.amount, 0);
  const monthNet = monthIncome - monthExpense;

  return (
    <div className="space-y-6 pb-28 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Monthly Summary Banner ── */}
      {listItems.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 p-5 shadow-lg">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/5 rounded-full" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-3">
            {t(language, "activity.summary.this_month")}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/80 mb-1">
                {t(language, "activity.summary.income")}
              </p>
              <p className="text-base font-bold text-emerald-400 tabular-nums">
                {formatVndCompact(monthIncome, householdLocale)}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-rose-400/80 mb-1">
                {t(language, "activity.summary.expense")}
              </p>
              <p className="text-base font-bold text-rose-400 tabular-nums">
                {formatVndCompact(monthExpense, householdLocale)}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1">
                {t(language, "activity.summary.net")}
              </p>
              <p
                className={cn(
                  "text-base font-bold tabular-nums",
                  monthNet >= 0 ? "text-white" : "text-rose-400",
                )}
              >
                {monthNet >= 0 ? "+" : ""}
                {formatVndCompact(monthNet, householdLocale)}
              </p>
            </div>
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title={t(language, "activity.empty.no_accounts")}
          description={t(language, "activity.empty.no_accounts_desc")}
          action={
            <Button asChild>
              <Link href="/accounts">{t(language, "activity.empty.go_to_accounts")}</Link>
            </Button>
          }
          className="bg-amber-50/50 border-amber-200"
        />
      ) : (
        <div className="space-y-6">
          {/* ── Quick Add (mobile-first) ── */}
          <Card className="border-primary/20 bg-primary/5 sm:hidden">
            <CardHeader className="pb-2">
              <SectionHeader
                label={t(language, "activity.form.speed")}
                title={t(language, "activity.form.quick_add")}
                description={t(language, "activity.form.quick_add_desc")}
              />
            </CardHeader>
            <CardContent>
              <QuickAddForm
                accountId={accounts[0]!.id}
                categories={quickCategories}
              />
            </CardContent>
          </Card>

          {/* ── Add FAB (floating action button look on mobile) ── */}
          <div className="flex gap-3 sm:hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              {t(language, "activity.form.or_add_detail")}
            </div>
          </div>

          {/* ── Detailed Entry ── */}
          <Card>
            <CardHeader className="pb-2">
              <SectionHeader
                label={t(language, "activity.form.details")}
                title={t(language, "activity.form.detailed_entry")}
                description={t(language, "activity.form.detailed_entry_desc")}
              />
            </CardHeader>
            <CardContent>
              <DetailedTransactionForm
                accounts={accounts.map((account) => ({
                  id: account.id,
                  name: account.name,
                }))}
                categories={categories
                  .filter(
                    (category) =>
                      category.kind === "income" || category.kind === "expense",
                  )
                  .map((category) => ({
                    id: category.id,
                    name: category.name,
                    kind: category.kind as "income" | "expense",
                  }))}
              />
            </CardContent>
          </Card>

          {/* ── Recurring Link ── */}
          <Link href="/recurring">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Repeat className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {t(language, "activity.form.recurring")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(language, "activity.form.recurring_desc")}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* ── History ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                {t(language, "activity.list.recent")}
              </h2>
              <span className="text-xs text-muted-foreground font-medium">
                {t(language, "activity.list.latest_shown")}
              </span>
            </div>

            {/* Month legend */}
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1 text-emerald-600">
                <ArrowUpRight className="h-3 w-3" />
                {t(language, "activity.list.in")}
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <ArrowDownRight className="h-3 w-3" />
                {t(language, "activity.list.out")}
              </span>
            </div>

            {transactionsResult.error ? (
              <EmptyState
                icon={History}
                title={t(language, "transactions.error")}
                description={transactionsResult.error.message}
                className="bg-destructive/5 border-destructive/20"
              />
            ) : null}

            {listItems.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={t(language, "activity.empty.no_transactions")}
                description={t(language, "activity.empty.no_transactions_desc")}
              />
            ) : (
              <Card className="overflow-hidden border-border/60">
                <CardContent className="p-0">
                  <TransactionsList
                    accounts={accounts.map((account) => ({
                      id: account.id,
                      name: account.name,
                    }))}
                    categories={categories
                      .filter(
                        (category) =>
                          category.kind === "income" ||
                          category.kind === "expense",
                      )
                      .map((category) => ({
                        id: category.id,
                        name: category.name,
                        kind: category.kind as "income" | "expense",
                      }))}
                    initialPage={{
                      items: historyItems,
                      nextCursor: historyNextCursor,
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
