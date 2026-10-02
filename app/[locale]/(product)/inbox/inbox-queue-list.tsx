"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import {
  InboxItemKind,
  InboxKindFilter,
  INBOX_TEST_ID,
  inboxFilterTestId,
} from "@/modules/inbox/application/inbox-constants";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";
import { motionTokens, springs, useMotionPolicy } from "@/shared/motion";
import { EmptyState } from "@/shared/patterns/empty-state";
import { FilterChip } from "@/shared/patterns/filter-chip";
import { SearchInput } from "@/shared/ui/search-input";
import { Text } from "@/shared/ui/text";
import { Button, ButtonVariant } from "@/shared/ui/button";
import type { InboxPageCursor } from "@/modules/inbox/application/inbox-types";
import { loadMoreInboxAction } from "./actions";
import {
  isInboxFilterActive,
  type InboxKindFilterId,
} from "./inbox-presentations";
import { InboxQueueRow } from "./inbox-queue-row";
import { InboxSectionTitle } from "./inbox-section-title";

type Props = {
  items: InboxReviewItem[];
  locale: string;
  readOnly?: boolean;
  nextCursor?: InboxPageCursor | null;
};

const KIND_FILTERS: readonly InboxKindFilterId[] = [
  InboxKindFilter.ALL,
  InboxItemKind.UNMAPPED_EXPENSE,
  InboxItemKind.SAVINGS_MATURITY,
  InboxItemKind.EMERGENCY_DECLARATION,
  InboxItemKind.LOAN_PAYMENT_ATTENTION,
  InboxItemKind.EMI_COMPLETE,
  InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION,
  InboxItemKind.DEBT_PAYMENT_ATTENTION,
  InboxItemKind.INCOME_SUGGEST,
];

export function InboxQueueList({
  items: initialItems,
  locale,
  readOnly = false,
  nextCursor: initialNextCursor = null,
}: Props) {
  const t = useTranslations("inbox");
  const policy = useMotionPolicy();
  const [kind, setKind] = useState<InboxKindFilterId>(InboxKindFilter.ALL);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (kind !== InboxKindFilter.ALL && item.kind !== kind) return false;
      if (!q) return true;
      const haystack = [
        item.displayTitle,
        item.title,
        item.note,
        item.categoryName,
        item.accountName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, kind, query]);
  const rows = filtered.filter(
    (item): item is InboxReviewItem & { kind: InboxItemKind } =>
      item.kind !== null,
  );
  const filterActive = isInboxFilterActive(kind, query);
  const filters = KIND_FILTERS.map((id) => ({
    id,
    label: id === InboxKindFilter.ALL ? t("filterAll") : t(`kinds.${id}`),
  }));

  const clearFilters = () => {
    setKind(InboxKindFilter.ALL);
    setQuery("");
  };

  return (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid={INBOX_TEST_ID.QUEUE_LIST}
    >
      <div
        className="flex flex-col gap-(--space-2)"
        data-testid={INBOX_TEST_ID.CONTROLS}
      >
        <SearchInput
          value={query}
          onChange={setQuery}
          ariaLabel={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          data-testid={INBOX_TEST_ID.SEARCH}
          className="border-transparent bg-surface-muted/70 hover:border-border-subtle"
        />
        <div
          className="flex flex-nowrap items-center gap-(--space-2) overflow-x-auto"
          role="group"
          aria-label={t("filterLabel")}
          data-testid={INBOX_TEST_ID.KIND_FILTER}
        >
          {filters.map((filter) => {
            const pressed = kind === filter.id;
            const label =
              filter.id === InboxKindFilter.ALL
                ? `${filter.label} ${rows.length}`
                : filter.label;

            return (
              <FilterChip
                key={filter.id}
                selected={pressed}
                onPress={() => setKind(filter.id)}
                className="max-w-full min-h-11 shrink-0 px-(--space-3) text-xs"
                data-testid={inboxFilterTestId(filter.id)}
              >
                {label}
              </FilterChip>
            );
          })}
        </div>
      </div>

      <section
        className="flex flex-col gap-(--space-3)"
        aria-label={t(readOnly ? "historySectionTitle" : "pendingSectionTitle")}
      >
        <div className="flex items-end justify-between gap-(--space-3)">
          <div className="min-w-0">
            <InboxSectionTitle>
              {t(readOnly ? "historySectionTitle" : "pendingSectionTitle")}
            </InboxSectionTitle>
            <Text
              size="xs"
              tone="secondary"
              className="mt-(--space-1) text-pretty"
            >
              {t(readOnly ? "historySectionBody" : "pendingSectionBody")}
            </Text>
          </div>
          <Text size="xs" tone="muted" className="shrink-0 tabular-nums">
            {t("sectionCount", { count: rows.length })}
          </Text>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title={t("filterEmptyTitle")}
            description={t("filterEmptyBody")}
            className="rounded-[var(--radius-card)] border border-dashed border-border-subtle bg-surface/60 px-(--space-4) py-(--space-5)"
            action={
              filterActive ? (
                <Button
                  variant={ButtonVariant.SECONDARY}
                  className="min-h-11 w-full"
                  data-testid={INBOX_TEST_ID.FILTER_CLEAR}
                  onPress={clearFilters}
                >
                  {t("filterClear")}
                </Button>
              ) : null
            }
          />
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            <AnimatePresence initial={false} mode="popLayout">
              {rows.map((item) => (
                <motion.li
                  key={item.id}
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    policy.enabled
                      ? { opacity: 0, y: -motionTokens.distance.xs }
                      : { opacity: 0 }
                  }
                  transition={
                    policy.enabled
                      ? springs.gentle
                      : { duration: motionTokens.duration.none }
                  }
                >
                  <InboxQueueRow
                    item={item}
                    locale={locale}
                    readOnly={readOnly}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      {!readOnly && nextCursor ? (
        <Button
          variant="secondary"
          className="min-h-11 w-full"
          isDisabled={loadingMore}
          data-testid={INBOX_TEST_ID.LOAD_MORE}
          onPress={async () => {
            setLoadingMore(true);
            const page = await loadMoreInboxAction(nextCursor);
            if (page) {
              setItems((current) => [...current, ...page.items]);
              setNextCursor(page.nextCursor);
            }
            setLoadingMore(false);
          }}
        >
          {loadingMore ? t("loadingMore") : t("loadMore")}
        </Button>
      ) : null}

      {readOnly ? null : (
        <Text
          size="sm"
          tone="secondary"
          data-testid={INBOX_TEST_ID.PARTNER_NOTE}
        >
          {t("partnerEqualNote")}
        </Text>
      )}
    </div>
  );
}
