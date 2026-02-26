"use client";

import { useActionState, useMemo, useState, useTransition } from "react";

import { addTransactionDetailedAction } from "@/app/transactions/actions";
import { initialTransactionActionState, type TransactionActionState } from "@/app/transactions/action-types";
import { VndQuickInput } from "@/app/transactions/_components/vnd-quick-input";

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; kind: "income" | "expense" };

type DetailedTransactionFormProps = {
  accounts: AccountOption[];
  categories: CategoryOption[];
};

export function DetailedTransactionForm({ accounts, categories }: DetailedTransactionFormProps) {
  const [state, action] = useActionState<TransactionActionState, FormData>(
    addTransactionDetailedAction,
    initialTransactionActionState,
  );
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"income" | "expense" | "transfer">("expense");

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.kind === type),
    [categories, type],
  );

  return (
    <form
      className="space-y-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        fd.set("type", type);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="type" value={type} />

      <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
        <button type="button" onClick={() => setType("expense")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${type === "expense" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>
          Expense
        </button>
        <button type="button" onClick={() => setType("income")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${type === "income" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>
          Income
        </button>
        <button type="button" onClick={() => setType("transfer")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${type === "transfer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>
          Transfer
        </button>
      </div>

      <div className="space-y-1">
        <label htmlFor="amount" className="text-sm font-medium text-slate-700">Amount (VND)</label>
        <VndQuickInput id="amount" name="amount" defaultValue={0} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" />
      </div>

      <div className="space-y-1">
        <label htmlFor="accountId" className="text-sm font-medium text-slate-700">
          {type === "transfer" ? "From Account" : "Account"}
        </label>
        <select id="accountId" name="accountId" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900">
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>{account.name}</option>
          ))}
        </select>
      </div>

      {type === "transfer" ? (
        <div className="space-y-1">
          <label htmlFor="counterpartyAccountId" className="text-sm font-medium text-slate-700">To Account</label>
          <select id="counterpartyAccountId" name="counterpartyAccountId" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900">
            <option value="">Select destination account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-1">
          <label htmlFor="categoryId" className="text-sm font-medium text-slate-700">Category</label>
          <select id="categoryId" name="categoryId" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900">
            <option value="">No category</option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="transactionDate" className="text-sm font-medium text-slate-700">Date</label>
        <input
          id="transactionDate"
          name="transactionDate"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium text-slate-700">Description</label>
        <input id="description" name="description" placeholder="Optional note" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" />
      </div>

      <button type="submit" disabled={isPending} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {isPending ? "Saving..." : "Save Transaction"}
      </button>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
