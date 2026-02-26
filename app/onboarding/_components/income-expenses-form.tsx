"use client";

import { useActionState, useTransition } from "react";

import { addIncomeExpenseOnboardingAction } from "@/app/onboarding/actions";
import { initialOnboardingActionState, type OnboardingActionState } from "@/app/onboarding/action-types";
import { VndCurrencyInput } from "@/app/onboarding/_components/vnd-currency-input";

export function IncomeExpensesForm() {
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    addIncomeExpenseOnboardingAction,
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
        <label htmlFor="monthlyIncome" className="text-sm font-medium text-slate-700">Monthly income baseline (VND)</label>
        <VndCurrencyInput
          id="monthlyIncome"
          name="monthlyIncome"
          defaultValue={50000000}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="monthlyEssentials" className="text-sm font-medium text-slate-700">Monthly essential expenses baseline (VND)</label>
        <VndCurrencyInput
          id="monthlyEssentials"
          name="monthlyEssentials"
          defaultValue={25000000}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
        />
      </div>

      <button type="submit" disabled={isPending} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {isPending ? "Saving..." : "Save Baselines"}
      </button>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
