"use client";

import { useActionState, useMemo, useState, useTransition } from "react";

import {
  deleteTransactionAction,
  updateTransactionAction,
} from "@/app/transactions/actions";
import {
  initialTransactionActionState,
  type TransactionActionState,
} from "@/app/transactions/action-types";
import { formatVnd } from "@/lib/dashboard/format";
import { formatDate } from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";

type TransactionItem = {
  id: string;
  type: string;
  amount: number;
  transaction_date: string;
  description: string | null;
  category_id: string | null;
  account_id: string | null;
  counterparty_account_id: string | null;
  category_name: string | null;
  account_name: string | null;
  counterparty_account_name: string | null;
  member_name: string | null;
};

type OptionAccount = { id: string; name: string };
type OptionCategory = { id: string; name: string; kind: "income" | "expense" };

function TransactionRow({
  item,
  accounts,
  categories,
}: {
  item: TransactionItem;
  accounts: OptionAccount[];
  categories: OptionCategory[];
}) {
  const { locale, t, language } = useI18n();
  const vi = language === "vi";
  const [editState, editAction] = useActionState<TransactionActionState, FormData>(
    updateTransactionAction,
    initialTransactionActionState,
  );
  const [deleteState, deleteAction] = useActionState<TransactionActionState, FormData>(
    deleteTransactionAction,
    initialTransactionActionState,
  );
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [type, setType] = useState<"income" | "expense" | "transfer">(
    item.type === "income" || item.type === "transfer" ? item.type : "expense",
  );
  const filteredCategories = useMemo(
    () => categories.filter((category) => category.kind === type),
    [categories, type],
  );

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {item.type === "income"
              ? `${t("transactions.income")} · ${item.category_name ?? t("transactions.uncategorized")}`
              : item.type === "transfer"
                ? `${t("transactions.transfer")} · ${item.account_name ?? t("transactions.unknown_account")} -> ${item.counterparty_account_name ?? t("transactions.unknown_account")}`
                : `${t("transactions.expense")} · ${item.category_name ?? t("transactions.uncategorized")}`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {item.account_name ?? t("transactions.unknown_account")} · {formatDate(item.transaction_date, locale)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{t("transactions.logged_by")} {item.member_name ?? t("transactions.household_member")}</p>
          {item.description ? <p className="mt-1 text-sm text-slate-600">{item.description}</p> : null}
        </div>
        <div className="text-right">
          <p className={`text-sm font-semibold ${item.type === "income" ? "text-emerald-600" : item.type === "transfer" ? "text-slate-700" : "text-rose-600"}`}>
            {item.type === "income" ? "+" : item.type === "transfer" ? "\u2192" : "-"}{formatVnd(item.amount, locale)}
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing((value) => !value)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
            >
              {isEditing ? (vi ? "Đóng" : "Close") : (vi ? "Sửa" : "Edit")}
            </button>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!window.confirm(vi ? "Xóa giao dịch này?" : "Delete this transaction?")) return;
                const fd = new FormData(event.currentTarget);
                startTransition(() => deleteAction(fd));
              }}
            >
              <input type="hidden" name="transactionId" value={item.id} />
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 disabled:opacity-60"
              >
                {vi ? "Xóa" : "Delete"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {isEditing ? (
        <form
          className="mt-3 space-y-2 border-t border-slate-200 pt-3"
          onSubmit={(event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            fd.set("type", type);
            startTransition(() => editAction(fd));
          }}
        >
          <input type="hidden" name="transactionId" value={item.id} />
          <input type="hidden" name="type" value={type} />

          <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => setType("expense")} className={`rounded-lg px-2 py-2 text-xs font-semibold ${type === "expense" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>
              {vi ? "Chi tiêu" : "Expense"}
            </button>
            <button type="button" onClick={() => setType("income")} className={`rounded-lg px-2 py-2 text-xs font-semibold ${type === "income" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>
              {vi ? "Thu nhập" : "Income"}
            </button>
            <button type="button" onClick={() => setType("transfer")} className={`rounded-lg px-2 py-2 text-xs font-semibold ${type === "transfer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>
              {vi ? "Chuyển khoản" : "Transfer"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input name="amount" type="number" min={1} step={1} required defaultValue={Math.round(item.amount)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />
            <input name="transactionDate" type="date" required defaultValue={item.transaction_date.slice(0, 10)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />
          </div>

          <select name="accountId" required defaultValue={item.account_id ?? ""} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>

          {type === "transfer" ? (
            <select
              name="counterpartyAccountId"
              required
              defaultValue={item.counterparty_account_id ?? ""}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="">{vi ? "Chọn tài khoản đích" : "Select destination account"}</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          ) : (
            <select
              name="categoryId"
              required={type === "expense"}
              defaultValue={item.category_id ?? ""}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="">{type === "expense" ? (vi ? "Chọn danh mục" : "Select category") : (vi ? "Không có danh mục" : "No category")}</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          )}

          <input
            name="description"
            defaultValue={item.description ?? ""}
            placeholder={vi ? "Ghi chú (không bắt buộc)" : "Optional note"}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />

          <button type="submit" disabled={isPending} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
            {isPending ? (vi ? "Đang lưu..." : "Saving...") : (vi ? "Lưu thay đổi" : "Save changes")}
          </button>

          {editState.status === "error" && editState.message ? <p className="text-sm text-rose-600">{editState.message}</p> : null}
          {editState.status === "success" && editState.message ? <p className="text-sm text-emerald-600">{editState.message}</p> : null}
        </form>
      ) : null}

      {deleteState.status === "error" && deleteState.message ? <p className="mt-2 text-sm text-rose-600">{deleteState.message}</p> : null}
      {deleteState.status === "success" && deleteState.message ? <p className="mt-2 text-sm text-emerald-600">{deleteState.message}</p> : null}
    </li>
  );
}

export function TransactionsList({
  items,
  accounts,
  categories,
}: {
  items: TransactionItem[];
  accounts: OptionAccount[];
  categories: OptionCategory[];
}) {
  const { t } = useI18n();

  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{t("transactions.none")}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <TransactionRow key={item.id} item={item} accounts={accounts} categories={categories} />
      ))}
    </ul>
  );
}
