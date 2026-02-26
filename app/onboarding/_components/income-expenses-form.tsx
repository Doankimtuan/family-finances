"use client";

import { useActionState, useTransition } from "react";

import { addIncomeExpenseOnboardingAction } from "@/app/onboarding/actions";
import {
  initialOnboardingActionState,
  type OnboardingActionState,
} from "@/app/onboarding/action-types";
import { VndCurrencyInput } from "@/app/onboarding/_components/vnd-currency-input";
import { Button } from "@/components/ui/button";

export function IncomeExpensesForm() {
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    addIncomeExpenseOnboardingAction,
    initialOnboardingActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="monthlyIncome"
            className="text-sm font-semibold text-slate-700"
          >
            Monthly income baseline (VND)
          </label>
          <VndCurrencyInput
            id="monthlyIncome"
            name="monthlyIncome"
            defaultValue={50000000}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-50"
          />
          <p className="text-xs text-slate-500 italic">
            Total monthly income after tax for the household.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="monthlyEssentials"
            className="text-sm font-semibold text-slate-700"
          >
            Monthly essential expenses (VND)
          </label>
          <VndCurrencyInput
            id="monthlyEssentials"
            name="monthlyEssentials"
            defaultValue={25000000}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-50"
          />
          <p className="text-xs text-slate-500 italic">
            Rent/Mortgage, utilities, groceries, and basic insurance.
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full py-6 text-base"
      >
        {isPending ? "Saving..." : "Save Baselines"}
      </Button>

      {state.status === "error" && state.message ? (
        <p className="text-sm font-medium text-rose-600 animate-in fade-in slide-in-from-top-1">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" && state.message ? (
        <p className="text-sm font-medium text-emerald-600 animate-in fade-in slide-in-from-top-1">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
