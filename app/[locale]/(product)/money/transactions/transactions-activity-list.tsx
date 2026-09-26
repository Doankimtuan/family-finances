"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  TransactionActivityKind,
  TransactionFilterType,
  TRANSACTION_LIST_OBSERVER_ROOT_MARGIN,
  type TransactionActivity,
} from "@/modules/ledger/application/client";
import { moneyTransactionPath } from "@/modules/tenancy/application/app-path";
import { SHELL_SCROLL_REGION_SLOT } from "@/shared/patterns/shell-scroll-region";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { AppIcon, IconContainer, Spinner, financeIconFor } from "@/shared/ui";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TransactionsDateGroup } from "./transactions-date-group";
import { TransactionListItem } from "./transaction-list-item";
import {
  ACTIVITY_TONE_TO_AMOUNT_TONE,
  activityIconKey,
  activityIconTone,
  activityRelationshipLabel,
  activityStatusMeta,
  activitySubtitle,
  activityTitle,
  amountAriaToneKey,
  dateGroupLabel,
  groupActivities,
  transactionsEventsHref,
} from "./transactions-list-presentations";

type Props = {
  initialActivities: TransactionActivity[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
  type: TransactionFilterType;
  query: string;
  categoryIds: string[];
  jarIds: string[];
  selectedTagIds: string[];
  listKey: string;
  emptyState: ReactNode;
};

type ActivitySnapshot = {
  key: string;
  firstPageIds: string[];
  activities: TransactionActivity[];
  nextCursor: string | null;
  hasMore: boolean;
  scrollTop: number;
};

let activitySnapshot: ActivitySnapshot | null = null;

function appendUniqueActivities(
  current: TransactionActivity[],
  incoming: TransactionActivity[],
) {
  const seen = new Set(current.map((activity) => activity.id));
  return [...current, ...incoming.filter((activity) => !seen.has(activity.id))];
}

export function TransactionsActivityList({
  initialActivities,
  initialNextCursor,
  initialHasMore,
  type,
  query,
  categoryIds,
  jarIds,
  selectedTagIds,
  listKey,
  emptyState,
}: Props) {
  const t = useTranslations("money.transactionsPage");
  const tMoney = useTranslations("money");
  const tCatalog = useTranslations("catalog");
  const locale = useLocale();
  const initialIds = initialActivities.map((activity) => activity.id);
  const [restoredSnapshot] = useState<ActivitySnapshot | null>(() => {
    const cached = activitySnapshot;
    return cached?.key === listKey &&
      cached.firstPageIds.length === initialIds.length &&
      cached.firstPageIds.every((id, index) => id === initialIds[index])
      ? cached
      : null;
  });
  const [activities, setActivities] = useState(
    restoredSnapshot?.activities ?? initialActivities,
  );
  const [nextCursor, setNextCursor] = useState(
    restoredSnapshot?.nextCursor ?? initialNextCursor,
  );
  const [hasMore, setHasMore] = useState(
    restoredSnapshot?.hasMore ?? initialHasMore,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const busyRef = useRef(false);
  const activityRef = useRef(restoredSnapshot?.activities ?? initialActivities);
  const cursorRef = useRef(restoredSnapshot?.nextCursor ?? initialNextCursor);
  const moreRef = useRef(restoredSnapshot?.hasMore ?? initialHasMore);
  const activeControllerRef = useRef<AbortController | null>(null);
  const firstPageIds = useRef(initialIds);

  const loadNextPage = useCallback(async () => {
    const cursor = cursorRef.current;
    if (!cursor || !moreRef.current || busyRef.current) return;

    busyRef.current = true;
    setIsLoading(true);
    setHasLoadError(false);
    const controller = new AbortController();
    activeControllerRef.current = controller;

    try {
      const response = await fetch(
        transactionsEventsHref(type, selectedTagIds, cursor, {
          q: query || undefined,
          categoryIds,
          jarIds,
        }),
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error(t("loadMoreError"));

      const result = (await response.json()) as {
        activities: TransactionActivity[];
        hasMore: boolean;
        nextCursor: string | null;
      };
      const nextActivities = appendUniqueActivities(
        activityRef.current,
        result.activities,
      );
      activityRef.current = nextActivities;
      cursorRef.current = result.nextCursor;
      moreRef.current = result.hasMore && Boolean(result.nextCursor);
      setActivities(nextActivities);
      setNextCursor(result.nextCursor);
      setHasMore(moreRef.current);
    } catch {
      if (!controller.signal.aborted) setHasLoadError(true);
    } finally {
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
      }
      busyRef.current = false;
      setIsLoading(false);
    }
  }, [categoryIds, jarIds, query, selectedTagIds, t, type]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(
      `[data-slot="${SHELL_SCROLL_REGION_SLOT}"]`,
    );
    if (root && restoredSnapshot) root.scrollTop = restoredSnapshot.scrollTop;
  }, [restoredSnapshot]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(
      `[data-slot="${SHELL_SCROLL_REGION_SLOT}"]`,
    );
    activitySnapshot = {
      key: listKey,
      firstPageIds: firstPageIds.current,
      activities,
      nextCursor,
      hasMore,
      scrollTop: root?.scrollTop ?? 0,
    };
  }, [activities, hasMore, listKey, nextCursor]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(
      `[data-slot="${SHELL_SCROLL_REGION_SLOT}"]`,
    );
    if (!root) return;
    const handleScroll = () => {
      if (activitySnapshot?.key === listKey) {
        activitySnapshot.scrollTop = root.scrollTop;
      }
    };
    root.addEventListener("scroll", handleScroll, { passive: true });
    return () => root.removeEventListener("scroll", handleScroll);
  }, [listKey]);

  useEffect(() => {
    if (
      !hasMore ||
      hasLoadError ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const root = document.querySelector<HTMLElement>(
      `[data-slot="${SHELL_SCROLL_REGION_SLOT}"]`,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadNextPage();
      },
      { root, rootMargin: TRANSACTION_LIST_OBSERVER_ROOT_MARGIN },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasLoadError, hasMore, loadNextPage, nextCursor]);

  useEffect(
    () => () => {
      activeControllerRef.current?.abort();
    },
    [],
  );

  const groupedActivities = groupActivities(activities);
  const activityKindLabels: Record<TransactionActivityKind, string> = {
    [TransactionActivityKind.INCOME]: t("activityKind.income"),
    [TransactionActivityKind.EXPENSE]: t("activityKind.expense"),
    [TransactionActivityKind.TRANSFER]: t("activityKind.transfer"),
    [TransactionActivityKind.REFUND]: t("activityKind.refund"),
    [TransactionActivityKind.LIABILITY_PAYMENT]: t(
      "activityKind.liability_payment",
    ),
    [TransactionActivityKind.LOAN_INTEREST]: t("activityKind.loan_interest"),
    [TransactionActivityKind.DEBT_BORROWING]: t("activityKind.debt_borrowing"),
    [TransactionActivityKind.DEBT_LENDING]: t("activityKind.debt_lending"),
    [TransactionActivityKind.DEBT_RECEIPT]: t("activityKind.debt_receipt"),
    [TransactionActivityKind.SAVINGS]: t("activityKind.savings"),
    [TransactionActivityKind.INVESTMENT]: t("activityKind.investment"),
    [TransactionActivityKind.OTHER]: t("activityKind.other"),
  };
  const dateLabels = {
    today: t("dates.today"),
    yesterday: t("dates.yesterday"),
  };
  const relationshipLabels = {
    partiallyRefunded: t("relationship.partiallyRefunded"),
    fullyRefunded: t("relationship.fullyRefunded"),
  };

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isLoading
          ? t("loadingMore")
          : t("activitiesLoaded", { count: activities.length })}
      </div>
      <div
        className="flex flex-col gap-(--space-5)"
        aria-busy={isLoading}
        data-testid="transactions-activity-list"
      >
        {groupedActivities.map((group) => (
          <TransactionsDateGroup
            key={group.date}
            date={group.date}
            label={dateGroupLabel(group.date, locale, dateLabels)}
          >
            {group.activities.map((activity) => {
              const title = activityTitle(
                activity,
                activityKindLabels,
                tCatalog,
              );
              const amount = formatCurrency(
                activity.amount,
                activity.currency,
                locale,
                { maximumFractionDigits: 0 },
              );
              return (
                <TransactionListItem
                  key={activity.id}
                  href={moneyTransactionPath(activity.relatedTransactionIds[0])}
                  activityId={activity.id}
                  title={title}
                  subtitle={activitySubtitle(
                    activity,
                    title,
                    activityKindLabels,
                    tCatalog,
                  )}
                  amountLabel={`${activity.sign}${amount}`}
                  amountMeta={[
                    activityStatusMeta(activity, (status) =>
                      tMoney(`status.${status}`),
                    ),
                    activityRelationshipLabel(activity, relationshipLabels),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  amountAria={t(amountAriaToneKey(activity.tone), { amount })}
                  tone={ACTIVITY_TONE_TO_AMOUNT_TONE[activity.tone]}
                  leading={
                    <IconContainer tone={activityIconTone(activity)} size="sm">
                      <AppIcon
                        icon={financeIconFor(activityIconKey(activity))}
                        size="sm"
                      />
                    </IconContainer>
                  }
                />
              );
            })}
          </TransactionsDateGroup>
        ))}

        {hasLoadError ? (
          <div
            className="flex flex-col items-center gap-(--space-2)"
            role="alert"
          >
            <p className="text-center text-sm text-text-secondary">
              {t("loadMoreError")}
            </p>
            <Button
              variant={ButtonVariant.SECONDARY}
              onPress={() => void loadNextPage()}
            >
              {t("retry")}
            </Button>
          </div>
        ) : null}

        {isLoading && !hasLoadError ? (
          <div
            className="flex items-center justify-center gap-(--space-2) py-(--space-3) text-sm text-text-secondary"
            aria-hidden="true"
            data-testid="transactions-load-more-loading"
          >
            <Spinner size="sm" className="text-accent" />
            <span>{t("loadingMore")}</span>
          </div>
        ) : null}
        {!hasLoadError && hasMore ? (
          <div ref={sentinelRef} className="min-h-1" aria-hidden="true" />
        ) : null}
        {!hasMore && activities.length > 0 ? (
          <p className="py-(--space-2) text-center text-sm text-text-secondary">
            {t("allLoaded")}
          </p>
        ) : null}
        {!activities.length && !hasMore && !hasLoadError ? emptyState : null}
      </div>
    </>
  );
}
