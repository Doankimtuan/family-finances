"use client";

import { useActionState, useTransition } from "react";

import { addAccountOnboardingAction } from "@/app/onboarding/actions";
import {
  initialOnboardingActionState,
  type OnboardingActionState,
} from "@/app/onboarding/action-types";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AccountsForm() {
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    addAccountOnboardingAction,
    initialOnboardingActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Account name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Vietcombank Main"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="type" className="text-sm font-medium text-slate-700">
          Account type
        </label>
        <Select name="type" defaultValue="checking">
          <SelectTrigger
            id="type"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-base text-slate-900"
          >
            <SelectValue placeholder="Account type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="checking">Checking</SelectItem>
            <SelectItem value="savings">Savings</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="ewallet">E-wallet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="openingBalance"
          className="text-sm font-medium text-slate-700"
        >
          Opening balance (VND)
        </label>
        <MoneyInput
          id="openingBalance"
          name="openingBalance"
          defaultValue={0}
          className="w-full"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Add Account"}
      </button>

      {state.status === "error" && state.message ? (
        <p className="text-sm text-rose-600">{state.message}</p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}
    </form>
  );
}
