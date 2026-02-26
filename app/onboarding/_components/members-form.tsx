"use client";

import { useActionState, useTransition } from "react";

import { inviteMemberOnboardingAction } from "@/app/onboarding/actions";
import { initialOnboardingActionState, type OnboardingActionState } from "@/app/onboarding/action-types";

export function MembersForm() {
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    inviteMemberOnboardingAction,
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
        <label htmlFor="email" className="text-sm font-medium text-slate-700">Partner email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="partner@example.com"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Creating invite..." : "Invite Member"}
      </button>

      <p className="text-xs text-slate-500">You can continue onboarding even if your partner joins later.</p>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="break-all text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
