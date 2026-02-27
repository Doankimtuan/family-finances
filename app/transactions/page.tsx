import Link from "next/link";

import { DetailedTransactionForm } from "@/app/transactions/_components/detailed-transaction-form";
import { QuickAddForm } from "@/app/transactions/_components/quick-add-form";
import { TransactionsList } from "@/app/transactions/_components/transactions-list";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Transactions | Family Finances",
};

export default async function TransactionsPage() {
  const { householdId, language } = await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
  const supabase = await createClient();

  const [accountsResult, categoriesResult, transactionsResult] = await Promise.all([
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
      .select("id, type, amount, transaction_date, description, category_id, account_id, counterparty_account_id, paid_by_member_id")
      .eq("household_id", householdId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const accounts = accountsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const memberIds = Array.from(new Set((transactionsResult.data ?? []).map((tx) => tx.paid_by_member_id).filter(Boolean)));
  const profilesResult = memberIds.length
    ? await supabase.from("profiles").select("user_id, full_name").in("user_id", memberIds)
    : { data: [], error: null };
  const profileMap = new Map((profilesResult.data ?? []).map((p) => [p.user_id, p.full_name]));

  const listItems = (transactionsResult.data ?? []).map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: Number(tx.amount),
    transaction_date: tx.transaction_date,
    description: tx.description,
    category_id: tx.category_id,
    account_id: tx.account_id,
    counterparty_account_id: tx.counterparty_account_id,
    category_name: tx.category_id ? categoryMap.get(tx.category_id) ?? null : null,
    account_name: tx.account_id ? accountMap.get(tx.account_id) ?? null : null,
    counterparty_account_name: tx.counterparty_account_id ? accountMap.get(tx.counterparty_account_id) ?? null : null,
    member_name: tx.paid_by_member_id ? profileMap.get(tx.paid_by_member_id) ?? null : null,
  }));

  const quickCategories = categories
    .filter((category) => category.kind === "expense")
    .slice(0, 8)
    .map((category) => ({ id: category.id, name: category.name }));

  return (
    <AppShell header={<AppHeader title={t(language, "transactions.title")} />} footer={<BottomTabBar />}>
      <section className="space-y-4 pb-20 sm:pb-6">
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            {vi ? "Theo dõi dòng tiền" : "Cash Flow Tracking"}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {vi ? "Ghi nhanh, lịch sử gia đình rõ ràng" : "Fast logging, clear household history"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {vi
              ? "Thêm nhanh trên di động được tối ưu để ghi chi tiêu trong dưới 10 giây."
              : "Mobile quick add is optimized to keep expense logging under 10 seconds."}
          </p>
        </header>

        {accounts.length === 0 ? (
          <article className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-amber-700">
              {vi
                ? "Không tìm thấy tài khoản đang hoạt động. Hãy thêm tài khoản trước trong mục Tài khoản."
                : "No active account found. Add one first in Accounts module."}
            </p>
            <Link href="/accounts" className="mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              {vi ? "Đến Tài khoản" : "Go to Accounts"}
            </Link>
          </article>
        ) : (
          <>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:hidden">
              <h2 className="text-lg font-semibold text-slate-900">{vi ? "Thêm nhanh" : "Quick Add"}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {vi ? "Nhập số tiền, chọn danh mục và hoàn tất." : "Amount to category to done."}
              </p>
              <div className="mt-4">
                <QuickAddForm accountId={accounts[0]!.id} categories={quickCategories} />
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{vi ? "Nhập chi tiết" : "Detailed Entry"}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {vi ? "Dùng khi bạn cần chính xác ngày, tài khoản và danh mục." : "Use this when you need date/account/category precision."}
              </p>
              <div className="mt-4">
                <DetailedTransactionForm
                  accounts={accounts.map((account) => ({ id: account.id, name: account.name }))}
                  categories={categories
                    .filter((category) => category.kind === "income" || category.kind === "expense")
                    .map((category) => ({ id: category.id, name: category.name, kind: category.kind as "income" | "expense" }))}
                />
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{vi ? "Giao dịch gần đây" : "Recent Transactions"}</h2>
              {transactionsResult.error ? (
                <p className="mt-2 text-sm text-rose-600">{transactionsResult.error.message}</p>
              ) : (
                <div className="mt-3">
                  <TransactionsList
                    items={listItems}
                    accounts={accounts.map((account) => ({ id: account.id, name: account.name }))}
                    categories={categories
                      .filter((category) => category.kind === "income" || category.kind === "expense")
                      .map((category) => ({ id: category.id, name: category.name, kind: category.kind as "income" | "expense" }))}
                  />
                </div>
              )}
            </article>
          </>
        )}
      </section>
    </AppShell>
  );
}
