"use client";

import { useActionState, useTransition } from "react";

import { saveWelcomeAction } from "@/app/onboarding/actions";
import { initialOnboardingActionState, type OnboardingActionState } from "@/app/onboarding/action-types";

export function WelcomeForm({ initialHouseholdName }: { initialHouseholdName: string }) {
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    saveWelcomeAction,
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
        <label htmlFor="householdName" className="text-sm font-medium text-slate-700">Household name</label>
        <input
          id="householdName"
          name="householdName"
          required
          minLength={2}
          defaultValue={initialHouseholdName}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="timezone" className="text-sm font-medium text-slate-700">Timezone</label>
        <input
          id="timezone"
          name="timezone"
          defaultValue="Asia/Ho_Chi_Minh"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save Welcome Details"}
      </button>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
