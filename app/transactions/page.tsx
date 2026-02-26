import Link from "next/link";

import { DetailedTransactionForm } from "@/app/transactions/_components/detailed-transaction-form";
import { QuickAddForm } from "@/app/transactions/_components/quick-add-form";
import { TransactionsList } from "@/app/transactions/_components/transactions-list";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Transactions | Family Finances",
};

export default async function TransactionsPage() {
  const { householdId } = await getAuthenticatedHouseholdContext();
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
      .select("id, type, amount, transaction_date, description, category_id, account_id")
      .eq("household_id", householdId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const accounts = accountsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const listItems = (transactionsResult.data ?? []).map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: Number(tx.amount),
    transaction_date: tx.transaction_date,
    description: tx.description,
    category_name: tx.category_id ? categoryMap.get(tx.category_id) ?? null : null,
    account_name: tx.account_id ? accountMap.get(tx.account_id) ?? null : null,
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-24">
      <section className="mx-auto w-full max-w-3xl space-y-4">
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Transactions Module</p>
          <h1 className="text-2xl font-semibold text-slate-900">Log and review cash flow</h1>
          <p className="mt-1 text-sm text-slate-600">Quick add is optimized for fast mobile logging.</p>
        </header>

        {accounts.length === 0 ? (
          <article className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-amber-700">No active account found. Add one first in Accounts module.</p>
            <Link href="/accounts" className="mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Go to Accounts
            </Link>
          </article>
        ) : (
          <>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Detailed Entry</h2>
              <p className="mt-1 text-sm text-slate-600">Use full form when you need account/category/date details.</p>
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
              <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
              {transactionsResult.error ? (
                <p className="mt-2 text-sm text-rose-600">{transactionsResult.error.message}</p>
              ) : (
                <div className="mt-3">
                  <TransactionsList items={listItems} />
                </div>
              )}
            </article>
          </>
        )}
      </section>

      {accounts.length > 0 ? (
        <section className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:hidden">
          <div className="mx-auto w-full max-w-3xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Quick Add</p>
            <QuickAddForm />
          </div>
        </section>
      ) : null}
    </main>
  );
}
