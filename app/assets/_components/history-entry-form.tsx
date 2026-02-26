"use client";

import { useActionState, useTransition } from "react";

import { initialAssetActionState, type AssetActionState } from "@/app/assets/action-types";
import { VndInput } from "@/app/assets/_components/vnd-input";

type HistoryEntryFormProps = {
  assetId: string;
  mode: "quantity" | "price";
  actionFn: (prevState: AssetActionState, formData: FormData) => Promise<AssetActionState>;
};

export function HistoryEntryForm({ assetId, mode, actionFn }: HistoryEntryFormProps) {
  const [state, action] = useActionState<AssetActionState, FormData>(actionFn, initialAssetActionState);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="assetId" value={assetId} />

      <p className="text-sm font-semibold text-slate-800">
        {mode === "quantity" ? "Add / Update Quantity" : "Add / Update Unit Price"}
      </p>

      <div className="space-y-1">
        <label htmlFor={`${mode}-date`} className="text-sm font-medium text-slate-700">Date</label>
        <input
          id={`${mode}-date`}
          name="asOfDate"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
        />
      </div>

      {mode === "quantity" ? (
        <div className="space-y-1">
          <label htmlFor="quantity" className="text-sm font-medium text-slate-700">Quantity</label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            step="0.001"
            defaultValue="0"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          />
        </div>
      ) : (
        <div className="space-y-1">
          <label htmlFor="unitPrice" className="text-sm font-medium text-slate-700">Unit price (VND)</label>
          <VndInput id="unitPrice" name="unitPrice" defaultValue={0} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" />
        </div>
      )}

      <button type="submit" disabled={isPending} className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {isPending ? "Saving..." : "Save Entry"}
      </button>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
