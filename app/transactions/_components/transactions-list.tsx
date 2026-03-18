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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Pencil,
  Trash2,
  Tag,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  transaction_subtype?: string | null;
  is_non_cash?: boolean;
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
  const [editState, editAction] = useActionState<
    TransactionActionState,
    FormData
  >(updateTransactionAction, initialTransactionActionState);
  const [deleteState, deleteAction] = useActionState<
    TransactionActionState,
    FormData
  >(deleteTransactionAction, initialTransactionActionState);
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [type, setType] = useState<"income" | "expense" | "transfer">(
    (item.type === "income" || item.type === "transfer"
      ? item.type
      : "expense") as "income" | "expense" | "transfer",
  );
  const filteredCategories = useMemo(
    () => categories.filter((category) => category.kind === type),
    [categories, type],
  );

  const isIncome = type === "income";
  const isTransfer = type === "transfer";

  return (
    <li className="group bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Icon */}
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors",
            isIncome
              ? "bg-emerald-50 text-emerald-600"
              : isTransfer
                ? "bg-blue-50 text-blue-600"
                : "bg-slate-50 text-slate-600",
          )}
        >
          {isIncome ? (
            <ArrowUpRight className="h-6 w-6" />
          ) : isTransfer ? (
            <ArrowRight className="h-6 w-6" />
          ) : (
            <ArrowDownRight className="h-6 w-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {item.category_name ??
                (isTransfer
                  ? vi
                    ? "Chuyển khoản"
                    : "Transfer"
                  : vi
                    ? "Chưa phân loại"
                    : "Uncategorized")}
            </h3>
            {item.description && <span className="text-slate-300">·</span>}
            {item.description && (
              <p className="text-xs text-slate-500 truncate font-medium">
                {item.description}
              </p>
            )}
            {item.transaction_subtype?.startsWith("savings_") ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                Savings
              </span>
            ) : null}
            {item.is_non_cash ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                {vi ? "Phi tiền mặt" : "Non-cash"}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              {item.account_name ?? t("transactions.unknown_account")}
            </div>
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {formatDate(item.transaction_date, locale)}
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p
            className={cn(
              "text-base font-black tracking-tight",
              isIncome
                ? "text-emerald-600"
                : isTransfer
                  ? "text-blue-600"
                  : "text-slate-900",
            )}
          >
            {isIncome ? "+" : isTransfer ? "" : "-"}
            {formatVnd(item.amount, locale)}
          </p>
          <div className="flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              disabled={item.transaction_subtype?.startsWith("savings_")}
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
              title={vi ? "Sửa" : "Edit"}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (
                  !window.confirm(
                    vi ? "Xóa giao dịch này?" : "Delete this transaction?",
                  )
                )
                  return;
                const fd = new FormData(event.currentTarget);
                startTransition(() => deleteAction(fd));
              }}
            >
              <input type="hidden" name="transactionId" value={item.id} />
              <button
                type="submit"
                disabled={isPending || item.transaction_subtype?.startsWith("savings_")}
                className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                title={vi ? "Xóa" : "Delete"}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {isEditing ? (
        <form
          className="mt-2 space-y-3 border-t border-border/50 pt-4 px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300"
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
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`rounded-lg px-2 py-2 text-xs font-bold transition-all ${type === "expense" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {vi ? "Chi tiêu" : "Expense"}
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`rounded-lg px-2 py-2 text-xs font-bold transition-all ${type === "income" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {vi ? "Thu nhập" : "Income"}
            </button>
            <button
              type="button"
              onClick={() => setType("transfer")}
              className={`rounded-lg px-2 py-2 text-xs font-bold transition-all ${type === "transfer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {vi ? "Chuyển khoản" : "Transfer"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                {vi ? "Số tiền" : "Amount"}
              </label>
              <input
                name="amount"
                type="number"
                min={1}
                step={1}
                required
                defaultValue={Math.round(item.amount)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                {vi ? "Ngày tháng" : "Date"}
              </label>
              <input
                name="transactionDate"
                type="date"
                required
                defaultValue={item.transaction_date.slice(0, 10)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
              {vi ? "Tài khoản" : "Account"}
            </label>
            <Select
              name="accountId"
              required
              defaultValue={item.account_id ?? undefined}
            >
              <SelectTrigger className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                <SelectValue placeholder={t("transactions.account")} />
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                {vi ? "Tài khoản đích" : "To Account"}
              </label>
              <Select
                name="counterpartyAccountId"
                required
                defaultValue={item.counterparty_account_id ?? undefined}
              >
                <SelectTrigger className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all">
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                {vi ? "Danh mục" : "Category"}
              </label>
              <Select
                name="categoryId"
                required={type === "expense"}
                defaultValue={item.category_id ?? undefined}
              >
                <SelectTrigger className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all">
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
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
              {vi ? "Ghi chú" : "Note"}
            </label>
            <input
              name="description"
              defaultValue={item.description ?? ""}
              placeholder={vi ? "Ghi chú (không bắt buộc)" : "Optional note"}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {isPending
                ? vi
                  ? "Đang lưu..."
                  : "Saving..."
                : vi
                  ? "Lưu thay đổi"
                  : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              {vi ? "Hủy" : "Cancel"}
            </button>
          </div>

          {editState.status === "error" && editState.message ? (
            <p className="text-sm text-rose-600 font-medium">
              {editState.message}
            </p>
          ) : null}
          {editState.status === "success" && editState.message ? (
            <p className="text-sm text-emerald-600 font-medium">
              {editState.message}
            </p>
          ) : null}
        </form>
      ) : null}

      {deleteState.status === "error" && deleteState.message ? (
        <p className="mt-2 text-sm text-rose-600 font-medium">
          {deleteState.message}
        </p>
      ) : null}
      {deleteState.status === "success" && deleteState.message ? (
        <p className="mt-2 text-sm text-emerald-600 font-medium">
          {deleteState.message}
        </p>
      ) : null}
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
  const { t, locale, language } = useI18n();
  const vi = language === "vi";

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic py-4">
        {t("transactions.none")}
      </p>
    );
  }

  // Group by date
  const groups = new Map<string, TransactionItem[]>();
  for (const item of items) {
    const day = item.transaction_date.slice(0, 10);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(item);
  }

  const formatDayLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (isSameDay(d, today)) return vi ? "Hôm nay" : "Today";
    if (isSameDay(d, yesterday)) return vi ? "Hôm qua" : "Yesterday";

    return d.toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="divide-y divide-border/50">
      {Array.from(groups.entries()).map(([day, dayItems]) => {
        const dayIncome = dayItems
          .filter((tx) => tx.type === "income")
          .reduce((s, tx) => s + tx.amount, 0);
        const dayExpense = dayItems
          .filter((tx) => tx.type === "expense")
          .reduce((s, tx) => s + tx.amount, 0);

        return (
          <div key={day}>
            {/* Date header */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {formatDayLabel(day)}
              </span>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                {dayIncome > 0 && (
                  <span className="text-emerald-600">
                    +{formatVnd(dayIncome, locale)}
                  </span>
                )}
                {dayExpense > 0 && (
                  <span className="text-slate-500">
                    -{formatVnd(dayExpense, locale)}
                  </span>
                )}
              </div>
            </div>

            {/* Items */}
            <ul className="divide-y divide-border/30">
              {dayItems.map((item) => (
                <TransactionRow
                  key={item.id}
                  item={item}
                  accounts={accounts}
                  categories={categories}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
