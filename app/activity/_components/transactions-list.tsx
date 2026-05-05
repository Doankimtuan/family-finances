"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteTransactionAction,
  updateTransactionAction,
} from "@/app/activity/actions";
import {
  initialTransactionActionState,
  type TransactionActionState,
} from "@/app/activity/action-types";
import { formatVnd, formatDate } from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import { transactionKeys } from "@/lib/queries/keys";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Pencil,
  Trash2,
  Tag,
  CreditCard,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
type InitialTransactionPage = {
  items: TransactionItem[];
  nextCursor: string | null;
};

function TransactionRow({
  item,
  accounts,
  categories,
  onSuccess,
}: {
  item: TransactionItem;
  accounts: OptionAccount[];
  categories: OptionCategory[];
  onSuccess?: () => void;
}) {
  const { locale, t, language } = useI18n();
  const vi = language === "vi";
  const queryClient = useQueryClient();
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

  const handleDelete = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!window.confirm(vi ? "Xóa giao dịch này?" : "Delete this transaction?"))
      return;
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await deleteTransactionAction(deleteState, fd);
      if (result.status === "success") {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: transactionKeys.list() });
        onSuccess?.();
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };

  const handleEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    fd.set("type", type);
    startTransition(async () => {
      const result = await updateTransactionAction(editState, fd);
      if (result.status === "success") {
        toast.success(result.message);
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: transactionKeys.list() });
        onSuccess?.();
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };

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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={item.transaction_subtype?.startsWith("savings_")}
              onClick={() => setIsEditing(!isEditing)}
              className="h-7 w-7 text-slate-400 hover:text-primary"
              title={vi ? "Sửa" : "Edit"}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <form onSubmit={handleDelete}>
              <input type="hidden" name="transactionId" value={item.id} />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={isPending || item.transaction_subtype?.startsWith("savings_")}
                className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                title={vi ? "Xóa" : "Delete"}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {isEditing ? (
        <form
          className="mt-2 space-y-3 border-t border-border/50 pt-4 px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300"
          onSubmit={handleEdit}
        >
          <input type="hidden" name="transactionId" value={item.id} />
          <input type="hidden" name="type" value={type} />

          <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setType("expense")}
              className={cn(
                "rounded-lg transition-all text-xs font-bold",
                type === "expense" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
            >
              {vi ? "Chi tiêu" : "Expense"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setType("income")}
              className={cn(
                "rounded-lg transition-all text-xs font-bold",
                type === "income" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
            >
              {vi ? "Thu nhập" : "Income"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setType("transfer")}
              className={cn(
                "rounded-lg transition-all text-xs font-bold",
                type === "transfer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
            >
              {vi ? "Chuyển khoản" : "Transfer"}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                {vi ? "Số tiền" : "Amount"}
              </Label>
              <Input
                name="amount"
                type="number"
                min={1}
                step={1}
                required
                defaultValue={Math.round(item.amount)}
                className="bg-slate-50 focus:bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                {vi ? "Ngày tháng" : "Date"}
              </Label>
              <Input
                name="transactionDate"
                type="date"
                required
                defaultValue={item.transaction_date.slice(0, 10)}
                className="bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
              {vi ? "Tài khoản" : "Account"}
            </Label>
            <Select
              name="accountId"
              required
              defaultValue={item.account_id ?? undefined}
            >
              <SelectTrigger className="w-full bg-slate-50 focus:bg-white">
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
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                {vi ? "Tài khoản đích" : "To Account"}
              </Label>
              <Select
                name="counterpartyAccountId"
                required
                defaultValue={item.counterparty_account_id ?? undefined}
              >
                <SelectTrigger className="w-full bg-slate-50 focus:bg-white">
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
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                {vi ? "Danh mục" : "Category"}
              </Label>
              <Select
                name="categoryId"
                required={type === "expense"}
                defaultValue={item.category_id ?? undefined}
              >
                <SelectTrigger className="w-full bg-slate-50 focus:bg-white">
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

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
              {vi ? "Ghi chú" : "Note"}
            </Label>
            <Input
              name="description"
              defaultValue={item.description ?? ""}
              placeholder={vi ? "Ghi chú (không bắt buộc)" : "Optional note"}
              className="bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 font-bold"
            >
              {isPending
                ? vi
                  ? "Đang lưu..."
                  : "Saving..."
                : vi
                  ? "Lưu thay đổi"
                  : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="font-bold"
            >
              {vi ? "Hủy" : "Cancel"}
            </Button>
          </div>
        </form>
      ) : null}

      {editState.status === "error" && editState.message ? (
        <p className="mt-2 text-sm text-rose-600 font-medium px-4 pb-4">
          {editState.message}
        </p>
      ) : null}
      {deleteState.status === "error" && deleteState.message ? (
        <p className="mt-2 text-sm text-rose-600 font-medium px-4 pb-4">
          {deleteState.message}
        </p>
      ) : null}
    </li>
  );
}

export function TransactionsList({
  accounts,
  categories,
  initialPage,
}: {
  accounts: OptionAccount[];
  categories: OptionCategory[];
  initialPage?: InitialTransactionPage;
}) {
  const { t, locale, language } = useI18n();
  const vi = language === "vi";
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: transactionKeys.list(),
    queryFn: async ({ pageParam = null }) => {
      const params = new URLSearchParams({ limit: "20" });
      if (pageParam) params.set("cursor", pageParam);
      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null,
    initialData: initialPage
      ? {
          pages: [initialPage],
          pageParams: [null],
        }
      : undefined,
  });

  const allItems = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-rose-600 py-4 text-center">
        {t("transactions.error")}
      </p>
    );
  }

  if (allItems.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic py-4">
        {t("transactions.none")}
      </p>
    );
  }

  // Group by date
  const groups = new Map<string, TransactionItem[]>();
  for (const item of allItems) {
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
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: transactionKeys.list() })}
                />
              ))}
            </ul>
          </div>
        );
      })}

      {/* Pagination Controls */}
      {hasNextPage && (
        <div className="flex items-center justify-center px-4 py-4 border-t border-border/50 bg-muted/20">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="gap-2"
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {vi ? "Tải thêm" : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
