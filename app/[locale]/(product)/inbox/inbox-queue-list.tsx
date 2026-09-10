"use client";

import { useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import {
  InboxKindFilter,
  INBOX_ITEM_KIND_VALUES,
  INBOX_TEST_ID,
  inboxFilterTestId,
  inboxGroupTestId,
} from "@/modules/inbox/application/inbox-constants";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";
import { motionTokens, springs, useMotionPolicy } from "@/shared/motion";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Card } from "@/shared/patterns/card";
import { FilterChip } from "@/shared/patterns/filter-chip";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Input } from "@/shared/ui/input";
import { Text } from "@/shared/ui/text";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { Heading } from "@/shared/ui/heading";
import type { InboxPageCursor } from "@/modules/inbox/application/inbox-types";
import { loadMoreInboxAction } from "./actions";
import {
  groupInboxItemsByKind,
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
  ...INBOX_ITEM_KIND_VALUES,
];

export function InboxQueueList({
  items: initialItems,
  locale,
  readOnly = false,
  nextCursor: initialNextCursor = null,
}: Props) {
  const t = useTranslations("inbox");
  const searchId = useId();
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

  const groups = groupInboxItemsByKind(filtered);
  const filterActive = isInboxFilterActive(kind, query);

  const filters: { id: InboxKindFilterId; label: string }[] = KIND_FILTERS.map(
    (id) => ({
      id,
      label: id === InboxKindFilter.ALL ? t("filterAll") : t(`kinds.${id}`),
    }),
  );

  const clearFilters = () => {
    setKind(InboxKindFilter.ALL);
    setQuery("");
  };

  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid={INBOX_TEST_ID.QUEUE_LIST}
    >
      <Card
        tone="elevated"
        className="gap-(--space-3) p-(--space-3)"
        data-testid={INBOX_TEST_ID.CONTROLS}
      >
        <div className="flex items-center gap-(--space-2)">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-surface-muted text-text-secondary"
            aria-hidden
          >
            <AppIcon icon={ACTION_ICONS.search} size="sm" />
          </span>
          <label htmlFor={searchId} className="sr-only">
            {t("searchLabel")}
          </label>
          <Input
            id={searchId}
            type="search"
            value={query}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            onChange={(e) => setQuery(e.target.value)}
            data-testid={INBOX_TEST_ID.SEARCH}
            className="min-h-11 border-transparent bg-surface-muted/70 shadow-none focus-visible:border-border-subtle"
          />
        </div>
        <div
          className="flex flex-wrap gap-(--space-2) border-t border-border-subtle/60 pt-(--space-3)"
          role="group"
          aria-label={t("filterLabel")}
          data-testid={INBOX_TEST_ID.KIND_FILTER}
        >
          {filters.map((filter) => {
            const pressed = kind === filter.id;
            return (
              <FilterChip
                key={filter.id}
                selected={pressed}
                onPress={() => setKind(filter.id)}
                className="max-w-full min-h-11 shrink-0 px-(--space-3) text-xs"
                data-testid={inboxFilterTestId(filter.id)}
              >
                {filter.label}
              </FilterChip>
            );
          })}
        </div>
      </Card>

      <section
        className="flex flex-col gap-(--space-4)"
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
            {t("sectionCount", { count: filtered.length })}
          </Text>
        </div>

        {filtered.length === 0 ? (
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
          groups.map((group) => (
            <section
              key={group.kind}
              className="flex flex-col gap-(--space-2)"
              aria-labelledby={inboxGroupTestId(group.kind)}
              data-testid={inboxGroupTestId(group.kind)}
            >
              <Heading
                level={3}
                id={inboxGroupTestId(group.kind)}
                className="text-xs font-medium tracking-wide text-text-secondary"
              >
                {t(`kinds.${group.kind}`)}
              </Heading>
              <Card tone="elevated" className="gap-0 overflow-hidden p-0">
                <ul className="divide-y divide-divider">
                  <AnimatePresence initial={false} mode="popLayout">
                    {group.items.map((item) => (
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
              </Card>
            </section>
          ))
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
