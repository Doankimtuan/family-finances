"use client";

import { useActionState, useTransition } from "react";

import { addFirstGoalOnboardingAction } from "@/app/onboarding/actions";
import { initialOnboardingActionState, type OnboardingActionState } from "@/app/onboarding/action-types";
import { VndCurrencyInput } from "@/app/onboarding/_components/vnd-currency-input";

export function FirstGoalForm() {
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    addFirstGoalOnboardingAction,
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
        <label htmlFor="name" className="text-sm font-medium text-slate-700">Goal name</label>
        <input id="name" name="name" required placeholder="Emergency Fund (6 months)" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500" />
      </div>

      <div className="space-y-1">
        <label htmlFor="goalType" className="text-sm font-medium text-slate-700">Goal type</label>
        <select id="goalType" name="goalType" defaultValue="emergency_fund" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500">
          <option value="emergency_fund">Emergency fund</option>
          <option value="property_purchase">Property purchase</option>
          <option value="vehicle">Vehicle</option>
          <option value="education">Education</option>
          <option value="retirement">Retirement</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="targetAmount" className="text-sm font-medium text-slate-700">Target amount (VND)</label>
        <VndCurrencyInput
          id="targetAmount"
          name="targetAmount"
          defaultValue={180000000}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="targetDate" className="text-sm font-medium text-slate-700">Target date (optional)</label>
        <input id="targetDate" name="targetDate" type="date" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500" />
      </div>

      <button type="submit" disabled={isPending} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {isPending ? "Saving..." : "Save First Goal"}
      </button>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
