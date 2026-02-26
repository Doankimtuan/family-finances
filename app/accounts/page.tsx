import { ArchiveAccountButton } from "@/app/accounts/_components/archive-account-button";
import { CreateAccountForm } from "@/app/accounts/_components/create-account-form";
import { formatVnd } from "@/lib/dashboard/format";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Accounts | Family Finances",
};

type AccountRow = {
  id: string;
  name: string;
  type: string;
  opening_balance: number;
};

export default async function AccountsPage() {
  const { householdId } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const accountsResult = await supabase
    .from("accounts")
    .select("id, name, type, opening_balance")
    .eq("household_id", householdId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  const accounts = (accountsResult.data ?? []) as AccountRow[];

  const txResult = accounts.length
    ? await supabase
        .from("transactions")
        .select("account_id, type, amount")
        .eq("household_id", householdId)
        .in("account_id", accounts.map((account) => account.id))
    : { data: [], error: null };

  const balanceMap = new Map<string, number>();
  for (const account of accounts) {
    balanceMap.set(account.id, Number(account.opening_balance));
  }

  for (const row of txResult.data ?? []) {
    const current = balanceMap.get(row.account_id) ?? 0;
    const delta = row.type === "income" ? Number(row.amount) : row.type === "expense" ? -Number(row.amount) : 0;
    balanceMap.set(row.account_id, current + delta);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <section className="mx-auto w-full max-w-3xl space-y-4">
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Accounts Module</p>
          <h1 className="text-2xl font-semibold text-slate-900">Manage household accounts</h1>
          <p className="mt-1 text-sm text-slate-600">Track account balances used by transactions and cash flow.</p>
        </header>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create Account</h2>
          <div className="mt-4">
            <CreateAccountForm />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Active Accounts</h2>

          {accountsResult.error ? (
            <p className="mt-2 text-sm text-rose-600">{accountsResult.error.message}</p>
          ) : accounts.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No accounts yet. Add your first account above.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {accounts.map((account) => (
                <li key={account.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{account.name}</p>
                      <p className="text-xs text-slate-500">{account.type}</p>
                      <p className="mt-1 text-sm text-slate-700">Current balance: {formatVnd(balanceMap.get(account.id) ?? 0)}</p>
                    </div>
                    <ArchiveAccountButton accountId={account.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
