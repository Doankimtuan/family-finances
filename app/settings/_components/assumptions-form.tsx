"use client";

import { useActionState, useTransition } from "react";

import { updateAssumptionsAction } from "@/app/settings/actions";
import { initialSettingsActionState, type SettingsActionState } from "@/app/settings/action-types";

type AssumptionDefaults = {
  inflationAnnual: number;
  cashReturnAnnual: number;
  investmentReturnAnnual: number;
  propertyGrowthAnnual: number;
  goldGrowthAnnual: number;
  salaryGrowthAnnual: number;
};

function PercentInput({ id, name, label, defaultValue, note }: { id: string; name: string; label: string; defaultValue: number; note: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="decimal"
        min={0}
        max={100}
        step="0.1"
        required
        defaultValue={defaultValue.toFixed(1)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
      />
      <p className="text-xs text-slate-500">{note}</p>
    </div>
  );
}

export function AssumptionsForm({ defaults }: { defaults: AssumptionDefaults }) {
  const [state, action] = useActionState<SettingsActionState, FormData>(
    updateAssumptionsAction,
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PercentInput id="inflationAnnual" name="inflationAnnual" label="Inflation (annual %)" defaultValue={defaults.inflationAnnual} note="Used for real return and goal purchasing power." />
        <PercentInput id="salaryGrowthAnnual" name="salaryGrowthAnnual" label="Salary growth (annual %)" defaultValue={defaults.salaryGrowthAnnual} note="Used in long-horizon cash-flow projections." />
        <PercentInput id="cashReturnAnnual" name="cashReturnAnnual" label="Cash return (annual %)" defaultValue={defaults.cashReturnAnnual} note="Savings deposit / cash account expected growth." />
        <PercentInput id="investmentReturnAnnual" name="investmentReturnAnnual" label="Investment return (annual %)" defaultValue={defaults.investmentReturnAnnual} note="Mutual funds/stocks expected baseline return." />
        <PercentInput id="propertyGrowthAnnual" name="propertyGrowthAnnual" label="Property growth (annual %)" defaultValue={defaults.propertyGrowthAnnual} note="Land/property appreciation assumption." />
        <PercentInput id="goldGrowthAnnual" name="goldGrowthAnnual" label="Gold growth (annual %)" defaultValue={defaults.goldGrowthAnnual} note="Used for gold wealth trajectory scenarios." />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save Assumptions"}
      </button>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
