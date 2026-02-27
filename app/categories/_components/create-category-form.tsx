"use client";

import { useActionState, useState, useTransition } from "react";

import { createCategoryAction } from "@/app/categories/actions";
import {
  initialCategoryActionState,
  type CategoryActionState,
} from "@/app/categories/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";

export function CreateCategoryForm() {
  const { language, t } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<CategoryActionState, FormData>(
    createCategoryAction,
    initialCategoryActionState,
  );
  const [isPending, startTransition] = useTransition();
  const [kind, setKind] = useState<"income" | "expense">("expense");

  return (
    <form
      className="space-y-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        fd.set("kind", kind);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setKind("expense")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            kind === "expense" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
          }`}
        >
          {vi ? "Chi tiêu" : "Expense"}
        </button>
        <button
          type="button"
          onClick={() => setKind("income")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            kind === "income" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
          }`}
        >
          {vi ? "Thu nhập" : "Income"}
        </button>
      </div>

      <div className="space-y-1">
        <label htmlFor="categoryName" className="text-sm font-medium text-slate-700">
          {vi ? "Tên danh mục" : "Category Name"}
        </label>
        <input
          id="categoryName"
          name="name"
          required
          placeholder={kind === "expense" ? (vi ? "VD: Trông trẻ" : "e.g. Childcare") : (vi ? "VD: Làm tự do" : "e.g. Freelance")}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="categoryColor" className="text-sm font-medium text-slate-700">
          {vi ? "Màu sắc" : "Color"}
        </label>
        <input
          id="categoryColor"
          name="color"
          type="color"
          defaultValue={kind === "expense" ? "#ef4444" : "#16a34a"}
          className="h-10 w-20 rounded-lg border border-slate-300 bg-white p-1"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? t("common.saving") : (vi ? "Tạo danh mục" : "Create Category")}
      </button>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
