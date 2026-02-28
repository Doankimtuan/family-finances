"use client";

import { useActionState, useMemo, useState, useTransition } from "react";

import { quickAddTransactionAction } from "@/app/transactions/actions";
import {
  initialTransactionActionState,
  type TransactionActionState,
} from "@/app/transactions/action-types";
import { MoneyInput } from "@/components/ui/money-input";
import { useI18n } from "@/lib/providers/i18n-provider";

type QuickCategory = {
  id: string;
  name: string;
};

type QuickAddFormProps = {
  accountId: string;
  categories: QuickCategory[];
};

export function QuickAddForm({ accountId, categories }: QuickAddFormProps) {
  const { language } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<TransactionActionState, FormData>(
    quickAddTransactionAction,
    initialTransactionActionState,
  );
  const [isPending, startTransition] = useTransition();
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id ?? "",
  );
  const [isIncomeMode, setIsIncomeMode] = useState(false);

  const helperText = useMemo(() => {
    if (isIncomeMode) {
      return vi
        ? "Chế độ thu nhập: nhập số tiền -> xong."
        : "Income mode: amount -> done.";
    }

    return vi
      ? "Luồng chi tiêu 10 giây: số tiền -> danh mục -> xong."
      : "10-second expense flow: amount -> category -> done.";
  }, [isIncomeMode, vi]);

  return (
    <form
      className="space-y-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        fd.set("type", isIncomeMode ? "income" : "expense");
        fd.set("accountId", accountId);
        fd.set("categoryId", isIncomeMode ? "" : activeCategoryId);
        startTransition(() => action(fd));
      }}
    >
      <input
        type="hidden"
        name="type"
        value={isIncomeMode ? "income" : "expense"}
      />
      <input type="hidden" name="accountId" value={accountId} />
      <input
        type="hidden"
        name="categoryId"
        value={isIncomeMode ? "" : activeCategoryId}
      />

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setIsIncomeMode(false)}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            !isIncomeMode
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600"
          }`}
        >
          {vi ? "Chi tiêu" : "Expense"}
        </button>
        <button
          type="button"
          onClick={() => setIsIncomeMode(true)}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            isIncomeMode
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600"
          }`}
        >
          {vi ? "Thu nhập" : "Income"}
        </button>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="quickAmount"
          className="text-sm font-medium text-slate-700"
        >
          {vi ? "Số tiền (VND)" : "Amount (VND)"}
        </label>
        <MoneyInput
          id="quickAmount"
          name="amount"
          defaultValue={0}
          autoFocus
          className="w-full text-xl font-semibold"
          placeholder="0"
        />
      </div>

      {!isIncomeMode ? (
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-700">
            {vi ? "Danh mục" : "Category"}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
                className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  activeCategoryId === category.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending || (!isIncomeMode && !activeCategoryId)}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending
          ? vi
            ? "Đang lưu..."
            : "Saving..."
          : isIncomeMode
            ? vi
              ? "Xong: Thêm thu nhập"
              : "Done: Add Income"
            : vi
              ? "Xong: Thêm chi tiêu"
              : "Done: Add Expense"}
      </button>

      <p className="text-xs text-slate-500">{helperText}</p>

      {state.status === "error" && state.message ? (
        <p className="text-sm text-rose-600">{state.message}</p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}
    </form>
  );
}
