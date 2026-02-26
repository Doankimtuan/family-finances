"use client";

import { useActionState, useTransition } from "react";

import { acceptInviteAction } from "@/app/household/actions";
import {
  initialHouseholdActionState,
  type HouseholdActionState,
} from "@/app/household/action-types";

export function AcceptInviteForm({ defaultToken = "" }: { defaultToken?: string }) {
  const [state, action] = useActionState<HouseholdActionState, FormData>(
    acceptInviteAction,
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
        <label htmlFor="token" className="text-sm font-medium text-slate-700">
          Invitation token
        </label>
        <input
          id="token"
          name="token"
          type="text"
          required
          defaultValue={defaultToken}
          placeholder="paste invitation token"
          className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base text-slate-900 outline-none focus:border-slate-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Accepting..." : "Accept Invitation"}
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
