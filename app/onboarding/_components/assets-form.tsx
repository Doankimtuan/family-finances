"use client";

import { useActionState, useTransition } from "react";

import { addAssetOnboardingAction } from "@/app/onboarding/actions";
import {
  initialOnboardingActionState,
  type OnboardingActionState,
} from "@/app/onboarding/action-types";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AssetsForm() {
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    addAssetOnboardingAction,
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
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Asset name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="SJC Gold"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="assetClass"
            className="text-sm font-medium text-slate-700"
          >
            Asset class
          </label>
          <Select name="assetClass" defaultValue="gold">
            <SelectTrigger
              id="assetClass"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-base text-slate-900"
            >
              <SelectValue placeholder="Asset class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
              <SelectItem value="real_estate">Real Estate</SelectItem>
              <SelectItem value="savings_deposit">Savings Deposit</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="unitLabel"
            className="text-sm font-medium text-slate-700"
          >
            Unit label
          </label>
          <input
            id="unitLabel"
            name="unitLabel"
            defaultValue="unit"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="quantity"
            className="text-sm font-medium text-slate-700"
          >
            Quantity
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            step="0.001"
            defaultValue="1"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="unitPrice"
            className="text-sm font-medium text-slate-700"
          >
            Unit price (VND)
          </label>
          <MoneyInput
            id="unitPrice"
            name="unitPrice"
            defaultValue={0}
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="isLiquid"
          className="text-sm font-medium text-slate-700"
        >
          Liquidity
        </label>
        <Select name="isLiquid" defaultValue="true">
          <SelectTrigger
            id="isLiquid"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-base text-slate-900"
          >
            <SelectValue placeholder="Liquidity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Liquid</SelectItem>
            <SelectItem value="false">Illiquid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Add Asset"}
      </button>

      {state.status === "error" && state.message ? (
        <p className="text-sm text-rose-600">{state.message}</p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}
    </form>
  );
}
