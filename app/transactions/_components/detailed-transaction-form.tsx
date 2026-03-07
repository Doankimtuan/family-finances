"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";

import { addTransactionDetailedAction } from "@/app/transactions/actions";
import {
  initialTransactionActionState,
  type TransactionActionState,
} from "@/app/transactions/action-types";
import { MoneyInput } from "@/components/ui/money-input";
import { useI18n } from "@/lib/providers/i18n-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; kind: "income" | "expense" };

type DetailedTransactionFormProps = {
  accounts: AccountOption[];
  categories: CategoryOption[];
};

export function DetailedTransactionForm({
  accounts,
  categories,
}: DetailedTransactionFormProps) {
  const { language } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<TransactionActionState, FormData>(
    addTransactionDetailedAction,
    initialTransactionActionState,
  );
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"income" | "expense" | "transfer">(
    "expense",
  );

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
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${type === "expense" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
        >
          {vi ? "Chi tiêu" : "Expense"}
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${type === "income" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
        >
          {vi ? "Thu nhập" : "Income"}
        </button>
        <button
          type="button"
          onClick={() => setType("transfer")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${type === "transfer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
        >
          {vi ? "Chuyển khoản" : "Transfer"}
        </button>
      </div>

      <div className="space-y-1">
        <label htmlFor="amount" className="text-sm font-medium text-slate-700">
          {vi ? "Số tiền (VND)" : "Amount (VND)"}
        </label>
        <MoneyInput
          id="amount"
          name="amount"
          defaultValue={0}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="accountId"
          className="text-sm font-medium text-slate-700"
        >
          {type === "transfer"
            ? vi
              ? "Từ tài khoản"
              : "From Account"
            : vi
              ? "Tài khoản"
              : "Account"}
        </label>
        <Select name="accountId" required>
          <SelectTrigger
            id="accountId"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-base text-slate-900"
          >
            <SelectValue
              placeholder={vi ? "Chọn tài khoản" : "Select account"}
            />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {type === "transfer" ? (
        <div className="space-y-1">
          <label
            htmlFor="counterpartyAccountId"
            className="text-sm font-medium text-slate-700"
          >
            {vi ? "Đến tài khoản" : "To Account"}
          </label>
          <Select name="counterpartyAccountId" required>
            <SelectTrigger
              id="counterpartyAccountId"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-base text-slate-900"
            >
              <SelectValue
                placeholder={
                  vi ? "Chọn tài khoản đích" : "Select destination account"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-1">
          <label
            htmlFor="categoryId"
            className="text-sm font-medium text-slate-700"
          >
            {vi ? "Danh mục" : "Category"}
          </label>
          <Select name="categoryId" required={type === "expense"}>
            <SelectTrigger
              id="categoryId"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-base text-slate-900"
            >
              <SelectValue
                placeholder={
                  type === "expense"
                    ? vi
                      ? "Chọn danh mục"
                      : "Select category"
                    : vi
                      ? "Không có danh mục"
                      : "No category"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.length === 0 ? (
                <SelectItem value="..." disabled>
                  {vi ? "Không có danh mục" : "No category"}
                </SelectItem>
              ) : (
                filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1">
        <label
          htmlFor="transactionDate"
          className="text-sm font-medium text-slate-700"
        >
          {vi ? "Ngày" : "Date"}
        </label>
        <input
          id="transactionDate"
          name="transactionDate"
          type="date"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="description"
          className="text-sm font-medium text-slate-700"
        >
          {vi ? "Mô tả" : "Description"}
        </label>
        <input
          id="description"
          name="description"
          placeholder={vi ? "Ghi chú (không bắt buộc)" : "Optional note"}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending
          ? vi
            ? "Đang lưu..."
            : "Saving..."
          : vi
            ? "Lưu giao dịch"
            : "Save Transaction"}
      </button>

      {state.spendingJarWarning ? (
        <div
          className={`rounded-xl border p-3 text-sm ${
            state.spendingJarWarning.alertLevel === "exceeded"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            {state.spendingJarWarning.alertLevel === "exceeded"
              ? (vi ? "Hũ đã vượt hạn mức tháng" : "Jar monthly limit exceeded")
              : (vi ? "Hũ đang gần chạm hạn mức" : "Jar is close to monthly limit")}
          </p>
          <p className="mt-1 text-xs">
            {state.spendingJarWarning.jarName}:{" "}
            {state.spendingJarWarning.spent.toLocaleString()} /{" "}
            {state.spendingJarWarning.limit.toLocaleString()} VND
            {state.spendingJarWarning.usagePercent !== null
              ? ` (${state.spendingJarWarning.usagePercent.toFixed(1)}%)`
              : ""}
          </p>
        </div>
      ) : null}

      {state.status === "error" && state.message ? (
        <p className="text-sm text-rose-600">{state.message}</p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}
    </form>
  );
}
