"use client";

import { useActionState, useTransition } from "react";

import { updateHouseholdSettingsAction } from "@/app/settings/actions";
import { initialSettingsActionState, type SettingsActionState } from "@/app/settings/action-types";

export function HouseholdSettingsForm({
  defaultName,
  defaultTimezone,
  defaultLocale,
}: {
  defaultName: string;
  defaultTimezone: string;
  defaultLocale: string;
}) {
  const [state, action] = useActionState<SettingsActionState, FormData>(
    updateHouseholdSettingsAction,
    initialSettingsActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Household name
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          defaultValue={defaultName}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="locale" className="text-sm font-medium text-slate-700">
            Locale
          </label>
          <input
            id="locale"
            name="locale"
            defaultValue={defaultLocale}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="timezone" className="text-sm font-medium text-slate-700">
            Timezone
          </label>
          <input
            id="timezone"
            name="timezone"
            defaultValue={defaultTimezone}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        Base currency is fixed to VND for data consistency.
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save Household Settings"}
      </button>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
