"use client";

import { useActionState, useTransition } from "react";

import { setCategoryActiveAction } from "@/app/categories/actions";
import { initialCategoryActionState, type CategoryActionState } from "@/app/categories/action-types";

type Props = {
  categoryId: string;
  currentActive: boolean;
};

export function CategoryActiveToggle({ categoryId, currentActive }: Props) {
  const [state, action] = useActionState<CategoryActionState, FormData>(
    setCategoryActiveAction,
    initialCategoryActionState,
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
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="isActive" value={String(!currentActive)} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-60"
      >
        {isPending ? "Saving..." : currentActive ? "Disable" : "Enable"}
      </button>
      {state.status === "error" && state.message ? <p className="text-xs text-rose-600">{state.message}</p> : null}
    </form>
  );
}
