"use client";

import { useActionState, useTransition } from "react";

import { upsertMonthlyBudgetAction } from "@/app/budgets/actions";
import {
  initialBudgetActionState,
  type BudgetActionState,
} from "@/app/budgets/action-types";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CategoryOption = {
  id: string;
  name: string;
};

type Props = {
  categories: CategoryOption[];
  monthDefault: string;
};

export function MonthlyBudgetForm({ categories, monthDefault }: Props) {
  const [state, action] = useActionState<BudgetActionState, FormData>(
    upsertMonthlyBudgetAction,
    initialBudgetActionState,
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
        <label
          htmlFor="budgetMonth"
          className="text-sm font-medium text-slate-700"
        >
          Month
        </label>
        <input
          id="budgetMonth"
          name="month"
          type="month"
          defaultValue={monthDefault}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="budgetCategoryId"
          className="text-sm font-medium text-slate-700"
        >
          Category
        </label>
        <Select name="categoryId">
          <SelectTrigger
            id="budgetCategoryId"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-base text-slate-900"
          >
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="plannedAmount"
          className="text-sm font-medium text-slate-700"
        >
          Planned Amount (VND)
        </label>
        <MoneyInput
          id="plannedAmount"
          name="plannedAmount"
          defaultValue={0}
          className="w-full"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || categories.length === 0}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save Monthly Budget"}
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
