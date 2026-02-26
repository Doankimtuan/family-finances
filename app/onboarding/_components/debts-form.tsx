"use client";

import { useActionState, useTransition } from "react";

import { addDebtOnboardingAction } from "@/app/onboarding/actions";
import { initialOnboardingActionState, type OnboardingActionState } from "@/app/onboarding/action-types";
import { VndCurrencyInput } from "@/app/onboarding/_components/vnd-currency-input";

export function DebtsForm() {
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    addDebtOnboardingAction,
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
        <label htmlFor="name" className="text-sm font-medium text-slate-700">Debt name</label>
        <input id="name" name="name" required placeholder="VPBank Mortgage" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500" />
      </div>

      <div className="space-y-1">
        <label htmlFor="liabilityType" className="text-sm font-medium text-slate-700">Type</label>
        <select id="liabilityType" name="liabilityType" defaultValue="mortgage" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500">
          <option value="mortgage">Mortgage</option>
          <option value="family_loan">Family Loan</option>
          <option value="personal_loan">Personal Loan</option>
          <option value="car_loan">Car Loan</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="principalOriginal" className="text-sm font-medium text-slate-700">Original principal (VND)</label>
          <VndCurrencyInput
            id="principalOriginal"
            name="principalOriginal"
            defaultValue={0}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="currentOutstanding" className="text-sm font-medium text-slate-700">Current outstanding (VND)</label>
          <VndCurrencyInput
            id="currentOutstanding"
            name="currentOutstanding"
            defaultValue={0}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="annualRate" className="text-sm font-medium text-slate-700">Annual rate (%)</label>
          <input id="annualRate" name="annualRate" type="number" min="0" step="0.01" defaultValue="0" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500" />
        </div>
        <div className="space-y-1">
          <label htmlFor="repaymentMethod" className="text-sm font-medium text-slate-700">Repayment method</label>
          <select id="repaymentMethod" name="repaymentMethod" defaultValue="annuity" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500">
            <option value="annuity">Equal total payment</option>
            <option value="equal_principal">Equal principal</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>
      </div>

      <button type="submit" disabled={isPending} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {isPending ? "Saving..." : "Add Debt"}
      </button>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
