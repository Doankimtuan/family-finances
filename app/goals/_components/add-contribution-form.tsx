"use client";

import { useActionState, useTransition } from "react";

import { addGoalContributionAction } from "@/app/goals/actions";
import { initialGoalActionState, type GoalActionState } from "@/app/goals/action-types";
import { VndQuickInput } from "@/app/transactions/_components/vnd-quick-input";

export function AddContributionForm({ goalId }: { goalId: string }) {
  const [state, action] = useActionState<GoalActionState, FormData>(
    addGoalContributionAction,
    initialGoalActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-2"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="goalId" value={goalId} />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <VndQuickInput
          id={`amount-${goalId}`}
          name="amount"
          defaultValue={0}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
          placeholder="Contribution"
        />
        <input
          name="contributionDate"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Add"}
        </button>
      </div>

      <input
        name="note"
        placeholder="Optional note"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500"
      />

      {state.status === "error" && state.message ? <p className="text-xs text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-xs text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
