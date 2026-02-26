"use client";

import { useActionState, useTransition } from "react";

import { createAssetAction } from "@/app/assets/actions";
import { initialAssetActionState, type AssetActionState } from "@/app/assets/action-types";
import { VndInput } from "@/app/assets/_components/vnd-input";

export function CreateAssetForm() {
  const [state, action] = useActionState<AssetActionState, FormData>(
    createAssetAction,
    initialAssetActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">Asset name</label>
        <input id="name" name="name" required className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" placeholder="SJC Gold" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="assetClass" className="text-sm font-medium text-slate-700">Class</label>
          <select id="assetClass" name="assetClass" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" defaultValue="gold">
            <option value="gold">Gold</option>
            <option value="mutual_fund">Mutual Fund</option>
            <option value="real_estate">Real Estate</option>
            <option value="savings_deposit">Savings Deposit</option>
            <option value="stock">Stock</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="unitLabel" className="text-sm font-medium text-slate-700">Unit label</label>
          <input id="unitLabel" name="unitLabel" defaultValue="unit" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="quantity" className="text-sm font-medium text-slate-700">Quantity</label>
          <input id="quantity" name="quantity" type="number" min="0" step="0.001" defaultValue="1" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" />
        </div>

        <div className="space-y-1">
          <label htmlFor="unitPrice" className="text-sm font-medium text-slate-700">Unit price (VND)</label>
          <VndInput id="unitPrice" name="unitPrice" defaultValue={0} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="isLiquid" className="text-sm font-medium text-slate-700">Liquidity</label>
        <select id="isLiquid" name="isLiquid" defaultValue="true" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900">
          <option value="true">Liquid</option>
          <option value="false">Illiquid</option>
        </select>
      </div>

      <button type="submit" disabled={isPending} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {isPending ? "Saving..." : "Add Asset"}
      </button>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
