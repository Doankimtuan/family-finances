"use client";

import { useState } from "react";
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
  const { locale, t } = useI18n();
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
    <li className="group border-b border-border/50 last:border-b-0 transition-colors hover:bg-muted/30 focus-within:bg-muted/30">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 px-4 py-4 sm:gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors sm:h-12 sm:w-12",
            isIncome
              ? "bg-emerald-500/10 text-emerald-600"
              : isTransfer
                ? "bg-blue-500/10 text-blue-600"
                : "bg-muted/70 text-muted-foreground",
          )}
        >
          {isIncome ? (
            <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : isTransfer ? (
            <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <ArrowDownRight className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </div>

        <div className="min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-0.5">
              <h3 className="truncate text-sm font-semibold text-foreground sm:text-[15px]">
                {item.category_name ??
                  (isTransfer
                    ? t("activity.alert.transfer")
                    : t("activity.alert.uncategorized"))}
              </h3>
              {item.description && (
                <p className="truncate text-xs leading-5 text-muted-foreground sm:text-sm">
                  {item.description}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
              {item.transaction_subtype?.startsWith(SAVINGS_SUBTYPE_PREFIX) ? (
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                  {t("activity.alert.savings")}
                </span>
              ) : null}
              {item.is_non_cash ? (
                <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">
                  {t("activity.alert.non_cash")}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-1">
              <CreditCard className="h-3.5 w-3.5" />
              <span className="truncate">{item.account_name ?? t("transactions.unknown_account")}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-1">
              <Tag className="h-3.5 w-3.5" />
              {formatDate(item.transaction_date, locale)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 text-right">
          <p
            className={cn(
              "text-sm font-bold tabular-nums tracking-tight sm:text-base",
              isIncome
                ? "text-emerald-600"
                : isTransfer
                  ? "text-blue-600"
                  : "text-foreground",
            )}
          >
            {isIncome ? "+" : isTransfer ? "" : "-"}
            {formatVnd(item.amount, locale)}
          </p>
          <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={item.transaction_subtype?.startsWith(SAVINGS_SUBTYPE_PREFIX)}
              onClick={() => setIsEditing(!isEditing)}
              className="h-7 w-7 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
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
              className="h-7 w-7 rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
              title={t("activity.edit.delete")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="border-t border-border/50 px-4 pb-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
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
  const { t, locale } = useI18n();
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
    <div className="space-y-3">
      {Array.from(groups.entries()).map(([day, dayItems]) => {
        const dayIncome = dayItems
          .filter((tx) => tx.type === "income")
          .reduce((s, tx) => s + tx.amount, 0);
        const dayExpense = dayItems
          .filter((tx) => tx.type === "expense")
          .reduce((s, tx) => s + tx.amount, 0);

        return (
          <section
            key={day}
            className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/30 px-4 py-3">
              <span className="inline-flex items-center rounded-full bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow-sm">
                {formatDayLabel(day)}
              </span>
              <div className="flex items-center gap-2 text-[11px] font-semibold tabular-nums">
                {dayIncome > 0 && (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-400">
                    +{formatVnd(dayIncome, locale)}
                  </span>
                )}
                {dayExpense > 0 && (
                  <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-rose-700 dark:text-rose-400">
                    -{formatVnd(dayExpense, locale)}
                  </span>
                )}
              </div>
            </div>

            <ul className="divide-y divide-border/50">
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
          </section>
        );
      })}

      {/* Pagination Controls */}
      {hasNextPage && (
        <div className="flex items-center justify-center px-4 py-4">
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
