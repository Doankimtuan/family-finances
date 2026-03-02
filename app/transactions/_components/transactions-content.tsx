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
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatVndCompact } from "@/lib/dashboard/format";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { cn } from "@/lib/utils";

export async function TransactionsContent({
  householdId,
  vi,
}: {
  householdId: string;
  vi: boolean;
}) {
  const supabase = await createClient();
  const { householdLocale } = await getAuthenticatedHouseholdContext();

  const [accountsResult, categoriesResult, transactionsResult] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("id, name")
        .eq("household_id", householdId)
        .eq("is_archived", false)
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
          "id, type, amount, transaction_date, description, category_id, account_id, counterparty_account_id, paid_by_member_id",
        )
        .eq("household_id", householdId)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50),
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
  }));

  const quickCategories = categories
    .filter((category) => category.kind === "expense")
    .slice(0, 8)
    .map((category) => ({ id: category.id, name: category.name }));

  // ── Monthly summary (current calendar month) ──────────────────────────
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthItems = listItems.filter(
    (tx) => tx.transaction_date >= monthStart,
  );
  const monthIncome = monthItems
    .filter((tx) => tx.type === "income")
    .reduce((s, tx) => s + tx.amount, 0);
  const monthExpense = monthItems
    .filter((tx) => tx.type === "expense")
    .reduce((s, tx) => s + tx.amount, 0);
  const monthNet = monthIncome - monthExpense;

  return (
    <div className="space-y-6 pb-28 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Monthly Summary Banner ── */}
      {listItems.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 p-5 shadow-lg">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/5 rounded-full" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-3">
            {vi ? "Tháng này" : "This month"}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/80 mb-1">
                {vi ? "Thu nhập" : "Income"}
              </p>
              <p className="text-base font-bold text-emerald-400 tabular-nums">
                {formatVndCompact(monthIncome, householdLocale)}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-rose-400/80 mb-1">
                {vi ? "Chi tiêu" : "Expense"}
              </p>
              <p className="text-base font-bold text-rose-400 tabular-nums">
                {formatVndCompact(monthExpense, householdLocale)}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1">
                {vi ? "Ròng" : "Net"}
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
          title={vi ? "Chưa có tài khoản" : "No active accounts"}
          description={
            vi
              ? "Hãy thêm tài khoản trước trong mục Tài sản để bắt đầu ghi giao dịch."
              : "Add your first account to start recording transactions."
          }
          action={
            <Button asChild>
              <Link href="/money">{vi ? "Đến Tài sản" : "Go to Assets"}</Link>
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
                label={vi ? "Nhanh" : "Speed"}
                title={vi ? "Thêm nhanh" : "Quick Add"}
                description={
                  vi
                    ? "Nhập số tiền, chọn danh mục và hoàn tất."
                    : "Amount → category → done."
                }
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
              {vi ? "Hoặc nhập chi tiết:" : "Or add with detail:"}
            </div>
          </div>

          {/* ── Detailed Entry ── */}
          <Card>
            <CardHeader className="pb-2">
              <SectionHeader
                label={vi ? "Chi tiết" : "Details"}
                title={vi ? "Nhập chi tiết" : "Detailed Entry"}
                description={
                  vi
                    ? "Chọn chính xác ngày, tài khoản và danh mục."
                    : "Precise date, account, and category."
                }
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

          {/* ── History ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                {vi ? "Giao dịch gần đây" : "Recent Transactions"}
              </h2>
              <span className="text-xs text-muted-foreground font-medium">
                {vi ? "Hiển thị 50 mới nhất" : "Latest 50 shown"}
              </span>
            </div>

            {/* Month legend */}
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1 text-emerald-600">
                <ArrowUpRight className="h-3 w-3" />
                {vi ? "Thu" : "In"}
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <ArrowDownRight className="h-3 w-3" />
                {vi ? "Chi" : "Out"}
              </span>
            </div>

            {transactionsResult.error ? (
              <EmptyState
                icon={History}
                title="Error loading history"
                description={transactionsResult.error.message}
                className="bg-destructive/5 border-destructive/20"
              />
            ) : listItems.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={vi ? "Chưa có giao dịch" : "No transactions"}
                description={
                  vi
                    ? "Bắt đầu thêm giao dịch đầu tiên của bạn."
                    : "Start adding your first transaction."
                }
              />
            ) : (
              <Card className="overflow-hidden border-border/60">
                <CardContent className="p-0">
                  <TransactionsList
                    items={listItems}
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
