"use client";

import { useActionState, useTransition } from "react";

import { deleteMonthlyBudgetAction } from "@/app/budgets/actions";
import { initialBudgetActionState, type BudgetActionState } from "@/app/budgets/action-types";

export function DeleteBudgetButton({ budgetId }: { budgetId: string }) {
  const [state, action] = useActionState<BudgetActionState, FormData>(
    deleteMonthlyBudgetAction,
    initialBudgetActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
      className="space-y-1"
    >
      <input type="hidden" name="budgetId" value={budgetId} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-60"
      >
        {isPending ? "Removing..." : "Remove"}
      </button>
      {state.status === "error" && state.message ? <p className="text-xs text-rose-600">{state.message}</p> : null}
    </form>
  );
}
