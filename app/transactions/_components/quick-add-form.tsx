"use client";

import { useActionState, useTransition } from "react";

import { quickAddTransactionAction } from "@/app/transactions/actions";
import { initialTransactionActionState, type TransactionActionState } from "@/app/transactions/action-types";
import { VndQuickInput } from "@/app/transactions/_components/vnd-quick-input";

export function QuickAddForm() {
  const [state, action] = useActionState<TransactionActionState, FormData>(
    quickAddTransactionAction,
    initialTransactionActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const selectedType = submitter?.value === "income" ? "income" : "expense";
        fd.set("type", selectedType);
        startTransition(() => action(fd));
      }}
    >
      <div className="space-y-1">
        <label htmlFor="quickAmount" className="text-sm font-medium text-slate-700">Amount (VND)</label>
        <VndQuickInput
          id="quickAmount"
          name="amount"
          defaultValue={0}
          autoFocus
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-xl font-semibold text-slate-900"
          placeholder="0"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="submit"
          name="quickType"
          value="expense"
          disabled={isPending}
          className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Add Expense"}
        </button>
        <button
          type="submit"
          name="quickType"
          value="income"
          disabled={isPending}
          className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Add Income"}
        </button>
      </div>

      <p className="text-xs text-slate-500">Mobile flow target: enter amount, tap Expense or Income.</p>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
