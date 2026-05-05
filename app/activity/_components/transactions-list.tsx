"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { formatVnd, formatDate } from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import { transactionKeys } from "@/lib/queries/keys";
import { Button } from "@/components/ui/button";
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
import { TransactionEditForm } from "./transaction-edit-form";
import { useTransactionActions } from "../_hooks/use-transaction-actions";
import { SAVINGS_SUBTYPE_PREFIX, PAGINATION_PAGE_SIZE } from "../_constants";

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
  const { updateTransaction, deleteTransaction, isPending } = useTransactionActions();
  const [isEditing, setIsEditing] = useState(false);

  const isIncome = item.type === "income";
  const isTransfer = item.type === "transfer";

  const handleDelete = () => {
    if (!window.confirm(t("activity.edit.confirm_delete"))) return;
    const formData = new FormData();
    formData.append("transactionId", item.id);
    deleteTransaction(formData, () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.list() });
      onSuccess?.();
    });
  };

  const handleEditSubmit = (formData: FormData) => {
    updateTransaction(formData, () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: transactionKeys.list() });
      onSuccess?.();
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
                  ? t("activity.alert.transfer")
                  : t("activity.alert.uncategorized"))}
            </h3>
            {item.description && <span className="text-slate-300">·</span>}
            {item.description && (
              <p className="text-xs text-slate-500 truncate font-medium">
                {item.description}
              </p>
            )}
            {item.transaction_subtype?.startsWith(SAVINGS_SUBTYPE_PREFIX) ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                {t("activity.alert.savings")}
              </span>
            ) : null}
            {item.is_non_cash ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                {t("activity.alert.non_cash")}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1 text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              {t("activity.list.in")}
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <ArrowDownRight className="h-3 w-3" />
              {t("activity.list.out")}
            </span>
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
              disabled={item.transaction_subtype?.startsWith(SAVINGS_SUBTYPE_PREFIX)}
              onClick={() => setIsEditing(!isEditing)}
              className="h-7 w-7 text-slate-400 hover:text-primary"
              title={t("activity.edit.edit")}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isPending || item.transaction_subtype?.startsWith(SAVINGS_SUBTYPE_PREFIX)}
              onClick={handleDelete}
              className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
              title={t("activity.edit.delete")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-2 border-t border-border/50 pt-4 px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <TransactionEditForm
            transaction={item}
            accounts={accounts}
            categories={categories}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditing(false)}
            isPending={isPending}
          />
        </div>
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
      const params = new URLSearchParams({ limit: String(PAGINATION_PAGE_SIZE) });
      if (pageParam) params.set("cursor", pageParam);
      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) throw new Error(t("transactions.error"));
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

    if (isSameDay(d, today)) return t("activity.list.today");
    if (isSameDay(d, yesterday)) return t("activity.list.yesterday");

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
            {t("activity.list.load_more")}
          </Button>
        </div>
      )}
    </div>
  );
}
