"use client";

import { useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { inboxItemPath } from "@/modules/tenancy/application/app-path";
import {
  InboxKindFilter,
  INBOX_ITEM_KIND_VALUES,
  INBOX_TEST_ID,
} from "@/modules/inbox/application/inbox-constants";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { motionTokens, springs, useMotionPolicy } from "@/shared/motion";
import { ReviewCard, ReviewCardDensity } from "@/shared/patterns/review-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Card } from "@/shared/patterns/card";
import { FilterChip } from "@/shared/patterns/filter-chip";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Input } from "@/shared/ui/input";
import { Text } from "@/shared/ui/text";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Button } from "@/shared/ui/button";
import type { InboxPageCursor } from "@/modules/inbox/application/inbox-types";
import { StatusBadgeTone } from "@/shared/ui/status-badge";
import { loadMoreInboxAction } from "./actions";
import { INBOX_REVIEW_ROW_CLASS } from "./inbox-chrome";
import {
  inboxDisplayTitle,
  inboxItemVisual,
  inboxLifecycleLabelKey,
  inboxOwnershipHintKey,
  inboxQueueDominantTitle,
  inboxQueueLifecycleLabel,
  inboxQueueRowSubtitle,
  type InboxKindFilterId,
} from "./inbox-presentations";
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
  const tCatalog = useTranslations("catalog");
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

  const filters: { id: InboxKindFilterId; label: string }[] = KIND_FILTERS.map(
    (id) => ({
      id,
      label: id === InboxKindFilter.ALL ? t("filterAll") : t(`kinds.${id}`),
    }),
  );

  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="inbox-queue-list"
    >
      <Card
        tone="elevated"
        className="gap-(--space-3) p-(--space-3)"
        data-testid="inbox-controls"
      >
        <div className="flex items-center gap-(--space-2)">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-surface-muted text-text-secondary"
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
            data-testid="inbox-search"
            className="min-h-10 border-transparent bg-surface-muted/70 shadow-none focus-visible:border-border-subtle"
          />
        </div>
        <div
          className="flex gap-(--space-2) overflow-x-auto border-t border-border-subtle/60 pt-(--space-3) [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label={t("filterLabel")}
          data-testid="inbox-kind-filter"
        >
          {filters.map((filter) => {
            const pressed = kind === filter.id;
            return (
              <FilterChip
                key={filter.id}
                selected={pressed}
                onPress={() => setKind(filter.id)}
                className="min-h-9 shrink-0 whitespace-nowrap px-(--space-3) text-xs"
                data-testid={`inbox-filter-${filter.id}`}
              >
                {filter.label}
              </FilterChip>
            );
          })}
        </div>
      </Card>

      <section
        className="flex flex-col gap-(--space-2)"
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
          />
        ) : (
          <Card tone="elevated" className="gap-0 overflow-hidden p-0">
            <ul className="divide-y divide-divider">
              <AnimatePresence initial={false} mode="popLayout">
                {filtered.map((item) => {
                  if (!item.kind) return null;
                  const visual = inboxItemVisual(item.kind);
                  const localizedCategory = item.categoryName
                    ? localizeCatalogName(
                        tCatalog,
                        "tags",
                        item.categoryName,
                      ) || item.categoryName
                    : null;
                  const displayTitle = inboxDisplayTitle({
                    note: item.note,
                    localizedCategory,
                    displayTitle: item.displayTitle,
                    kindLabel: t(`kinds.${item.kind}`),
                  });
                  const dominant = inboxQueueDominantTitle({
                    kind: item.kind,
                    displayTitle,
                  });
                  const title = dominant.title;
                  const detailParts = [
                    dominant.context,
                    item.accountName
                      ? localizeCatalogName(
                          tCatalog,
                          "accounts",
                          item.accountName,
                        ) || item.accountName
                      : null,
                    localizedCategory && item.note?.trim()
                      ? localizedCategory
                      : null,
                  ].filter((part): part is string => Boolean(part));
                  const lifecycleKey = inboxLifecycleLabelKey(
                    item.lifecycleContext,
                  );
                  const lifecycleLabel =
                    item.lifecycleDate && lifecycleKey
                      ? `${item.lifecycleOverdue ? t("lifecycleOverdue") : t(lifecycleKey)}: ${formatDate(new Date(item.lifecycleDate), locale)}`
                      : null;
                  const ownershipHintKey = readOnly
                    ? null
                    : inboxOwnershipHintKey(item.capability);
                  const unread = item.readAt == null;
                  const card = (
                    <ReviewCard
                      density={ReviewCardDensity.ROW}
                      showChevron={!readOnly}
                      unread={!readOnly && unread}
                      title={title}
                      kindLabel={
                        readOnly
                          ? t(`statuses.${item.status}`)
                          : t(`kinds.${item.kind}`)
                      }
                      amountLabel={
                        <FinancialValue dataTestId={INBOX_TEST_ID.AMOUNT}>
                          {formatCurrency(item.amount, item.currency, locale, {
                            maximumFractionDigits: 0,
                          })}
                        </FinancialValue>
                      }
                      leading={
                        <IconContainer tone={visual.tone} size="sm">
                          <AppIcon icon={visual.icon} size="sm" />
                        </IconContainer>
                      }
                      statusTone={
                        readOnly ? StatusBadgeTone.NEUTRAL : visual.statusTone
                      }
                      subtitle={inboxQueueRowSubtitle({
                        lifecycleLabel: inboxQueueLifecycleLabel({
                          context: item.lifecycleContext,
                          label: lifecycleLabel,
                        }),
                        ownershipHint: ownershipHintKey
                          ? t(ownershipHintKey)
                          : null,
                        detailParts,
                      })}
                      data-testid={`inbox-item-${item.id}`}
                    />
                  );

                  return (
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
                      {readOnly ? (
                        card
                      ) : (
                        <Link
                          href={inboxItemPath(item.id)}
                          aria-label={`${displayTitle} · ${unread ? t("unreadLabel") : t("readLabel")}`}
                          className={INBOX_REVIEW_ROW_CLASS}
                          data-testid={`inbox-item-link-${item.id}`}
                        >
                          {card}
                        </Link>
                      )}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </Card>
        )}
      </section>

      {!readOnly && nextCursor ? (
        <Button
          variant="secondary"
          className="w-full"
          isDisabled={loadingMore}
          data-testid="inbox-load-more"
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
        <Text size="sm" tone="secondary" data-testid="inbox-partner-note">
          {t("partnerEqualNote")}
        </Text>
      )}
    </div>
  );
}
