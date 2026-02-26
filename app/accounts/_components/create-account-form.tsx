"use client";

import { useActionState, useTransition } from "react";

import { createAccountAction } from "@/app/accounts/actions";
import { initialAccountActionState, type AccountActionState } from "@/app/accounts/action-types";
import { VndQuickInput } from "@/app/transactions/_components/vnd-quick-input";

export function CreateAccountForm() {
  const [state, action] = useActionState<AccountActionState, FormData>(
    createAccountAction,
    initialAccountActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">Account name</label>
        <input id="name" name="name" required className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" placeholder="Vietcombank Main" />
      </div>

      <div className="space-y-1">
        <label htmlFor="type" className="text-sm font-medium text-slate-700">Type</label>
        <select id="type" name="type" defaultValue="checking" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900">
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
          <option value="cash">Cash</option>
          <option value="ewallet">E-wallet</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="openingBalance" className="text-sm font-medium text-slate-700">Opening balance (VND)</label>
        <VndQuickInput id="openingBalance" name="openingBalance" defaultValue={0} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" />
      </div>

      <button type="submit" disabled={isPending} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {isPending ? "Saving..." : "Create Account"}
      </button>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
