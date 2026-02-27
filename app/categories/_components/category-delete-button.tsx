"use client";

import { useActionState, useTransition } from "react";

import { deleteCategoryAction } from "@/app/categories/actions";
import { initialCategoryActionState, type CategoryActionState } from "@/app/categories/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";

type Props = {
  categoryId: string;
};

export function CategoryDeleteButton({ categoryId }: Props) {
  const { language } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<CategoryActionState, FormData>(
    deleteCategoryAction,
    initialCategoryActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      noValidate
      className="space-y-1"
      onSubmit={(event) => {
        event.preventDefault();
        if (!window.confirm(vi ? "Xóa danh mục này? Hành động này không thể hoàn tác." : "Delete this category? This cannot be undone.")) return;
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-60"
      >
        {isPending ? (vi ? "Đang xóa..." : "Deleting...") : (vi ? "Xóa" : "Delete")}
      </button>
      {state.status === "error" && state.message ? <p className="text-xs text-rose-600">{state.message}</p> : null}
    </form>
  );
}
