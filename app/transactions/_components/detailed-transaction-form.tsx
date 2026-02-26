"use client";

import { useActionState, useMemo, useState, useTransition } from "react";

import { addTransactionDetailedAction } from "@/app/transactions/actions";
import { initialTransactionActionState, type TransactionActionState } from "@/app/transactions/action-types";
import { VndQuickInput } from "@/app/transactions/_components/vnd-quick-input";
import { useI18n } from "@/lib/providers/i18n-provider";

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; kind: "income" | "expense" };

type DetailedTransactionFormProps = {
  accounts: AccountOption[];
  categories: CategoryOption[];
};

export function DetailedTransactionForm({ accounts, categories }: DetailedTransactionFormProps) {
  const { language } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<TransactionActionState, FormData>(
    addTransactionDetailedAction,
    initialTransactionActionState,
  );
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"income" | "expense" | "transfer">("expense");

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.kind === type),
    [categories, type],
  );

  return (
    <form
      className="space-y-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        fd.set("type", type);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="type" value={type} />

      <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
        <button type="button" onClick={() => setType("expense")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${type === "expense" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>
          {vi ? "Chi tiêu" : "Expense"}
        </button>
        <button type="button" onClick={() => setType("income")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${type === "income" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>
          {vi ? "Thu nhập" : "Income"}
        </button>
        <button type="button" onClick={() => setType("transfer")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${type === "transfer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>
          {vi ? "Chuyển khoản" : "Transfer"}
        </button>
      </div>

      <div className="space-y-1">
        <label htmlFor="amount" className="text-sm font-medium text-slate-700">{vi ? "Số tiền (VND)" : "Amount (VND)"}</label>
        <VndQuickInput id="amount" name="amount" defaultValue={0} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" />
      </div>

      <div className="space-y-1">
        <label htmlFor="accountId" className="text-sm font-medium text-slate-700">
          {type === "transfer" ? (vi ? "Từ tài khoản" : "From Account") : (vi ? "Tài khoản" : "Account")}
        </label>
        <select id="accountId" name="accountId" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900">
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>{account.name}</option>
          ))}
        </select>
      </div>

      {type === "transfer" ? (
        <div className="space-y-1">
          <label htmlFor="counterpartyAccountId" className="text-sm font-medium text-slate-700">{vi ? "Đến tài khoản" : "To Account"}</label>
          <select id="counterpartyAccountId" name="counterpartyAccountId" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900">
            <option value="">{vi ? "Chọn tài khoản đích" : "Select destination account"}</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-1">
          <label htmlFor="categoryId" className="text-sm font-medium text-slate-700">{vi ? "Danh mục" : "Category"}</label>
          <select id="categoryId" name="categoryId" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900">
            <option value="">{vi ? "Không có danh mục" : "No category"}</option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="transactionDate" className="text-sm font-medium text-slate-700">{vi ? "Ngày" : "Date"}</label>
        <input
          id="transactionDate"
          name="transactionDate"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium text-slate-700">{vi ? "Mô tả" : "Description"}</label>
        <input id="description" name="description" placeholder={vi ? "Ghi chú (không bắt buộc)" : "Optional note"} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900" />
      </div>

      <button type="submit" disabled={isPending} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {isPending ? (vi ? "Đang lưu..." : "Saving...") : (vi ? "Lưu giao dịch" : "Save Transaction")}
      </button>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
