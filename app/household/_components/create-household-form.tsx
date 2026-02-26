"use client";

import { useActionState, useTransition } from "react";

import { createHouseholdAction } from "@/app/household/actions";
import {
  initialHouseholdActionState,
  type HouseholdActionState,
} from "@/app/household/action-types";

export function CreateHouseholdForm() {
  const [state, action] = useActionState<HouseholdActionState, FormData>(
    createHouseholdAction,
    initialHouseholdActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
    >
      <div className="space-y-1">
        <label htmlFor="householdName" className="text-sm font-medium text-slate-700">
          Household name
        </label>
        <input
          id="householdName"
          name="householdName"
          type="text"
          required
          minLength={2}
          placeholder="Nguyen-Tran Household"
          className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base text-slate-900 outline-none focus:border-slate-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Creating..." : "Create Household"}
      </button>

      {state.status === "error" && state.message ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" && state.message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
