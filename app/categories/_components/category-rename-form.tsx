"use client";

import { useActionState, useState, useTransition } from "react";

import { renameCategoryAction } from "@/app/categories/actions";
import { initialCategoryActionState, type CategoryActionState } from "@/app/categories/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";

type Props = {
  categoryId: string;
  currentName: string;
  currentColor: string | null;
};

export function CategoryRenameForm({ categoryId, currentName, currentColor }: Props) {
  const { language, t } = useI18n();
  const vi = language === "vi";
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<CategoryActionState, FormData>(
    renameCategoryAction,
    initialCategoryActionState,
  );
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
      >
        {vi ? "Sửa" : "Edit"}
      </button>
    );
  }

  return (
    <form
      className="space-y-1"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      <div className="flex items-center gap-2">
        <input
          name="name"
          defaultValue={currentName}
          minLength={2}
          required
          className="w-36 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
        />
        <input
          name="color"
          type="color"
          defaultValue={currentColor ?? "#64748b"}
          className="h-8 w-10 rounded border border-slate-300 bg-white p-0.5"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {isPending ? t("common.saving") : (vi ? "Lưu" : "Save")}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700"
        >
          {vi ? "Hủy" : "Cancel"}
        </button>
      </div>
      {state.status === "error" && state.message ? <p className="text-xs text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-xs text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
