"use client";

import { useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { inboxItemPath } from "@/modules/tenancy/application/app-path";
import {
  InboxItemKind,
  InboxLifecycleContext,
  INBOX_ITEM_KIND_VALUES,
} from "@/modules/inbox/application/inbox-constants";
import { InboxSourceCapability } from "@/modules/inbox/application/inbox-source-capabilities";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { motionTokens, springs, useMotionPolicy } from "@/shared/motion";
import { ReviewCard } from "@/shared/patterns/review-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Card } from "@/shared/patterns/card";
import { FilterChip } from "@/shared/patterns/filter-chip";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { FINANCE_ICONS, ACTION_ICONS } from "@/shared/ui/icon-registry";
import type { StatusBadgeTone } from "@/shared/ui/status-badge";
import { Input } from "@/shared/ui/input";
import { Text } from "@/shared/ui/text";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Button } from "@/shared/ui/button";
import type { InboxPageCursor } from "@/modules/inbox/application/inbox-types";
import { loadMoreInboxAction } from "./actions";

type KindFilter = "all" | (typeof INBOX_ITEM_KIND_VALUES)[number];

type Props = {
  items: InboxReviewItem[];
  locale: string;
  readOnly?: boolean;
  nextCursor?: InboxPageCursor | null;
};

type ItemVisual = {
  icon: (typeof FINANCE_ICONS)[keyof typeof FINANCE_ICONS];
  tone: "neutral" | "income" | "expense" | "transfer" | "savings" | "info";
  statusTone: StatusBadgeTone;
};

const KIND_FILTERS: readonly KindFilter[] = ["all", ...INBOX_ITEM_KIND_VALUES];

const ITEM_VISUALS: Record<InboxItemKind, ItemVisual> = {
  [InboxItemKind.UNMAPPED_EXPENSE]: {
    icon: FINANCE_ICONS.expense,
    tone: "expense",
    statusTone: "warning",
  },
  [InboxItemKind.INCOME_SUGGEST]: {
    icon: FINANCE_ICONS.income,
    tone: "income",
    statusTone: "info",
  },
  [InboxItemKind.SAVINGS_MATURITY]: {
    icon: FINANCE_ICONS.savings,
    tone: "savings",
    statusTone: "warning",
  },
  [InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION]: {
    icon: FINANCE_ICONS.savings,
    tone: "savings",
    statusTone: "warning",
  },
  [InboxItemKind.EMI_COMPLETE]: {
    icon: FINANCE_ICONS.loan,
    tone: "info",
    statusTone: "success",
  },
  [InboxItemKind.EMERGENCY_DECLARATION]: {
    icon: FINANCE_ICONS.transfer,
    tone: "transfer",
    statusTone: "attention",
  },
  [InboxItemKind.LOAN_PAYMENT_ATTENTION]: {
    icon: FINANCE_ICONS.loan,
    tone: "info",
    statusTone: "warning",
  },
  [InboxItemKind.DEBT_PAYMENT_ATTENTION]: {
    icon: FINANCE_ICONS.loan,
    tone: "expense",
    statusTone: "warning",
  },
};

function itemVisual(kind: InboxItemKind): ItemVisual {
  return ITEM_VISUALS[kind];
}

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
  const [kind, setKind] = useState<KindFilter>("all");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (kind !== "all" && item.kind !== kind) return false;
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

  const filters: { id: KindFilter; label: string }[] = KIND_FILTERS.map(
    (id) => ({
      id,
      label: id === "all" ? t("filterAll") : t(`kinds.${id}`),
    }),
  );

  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="inbox-queue-list"
    >
      <Card
        tone="soft"
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
            className="min-h-10 border-transparent bg-surface/70 shadow-none focus-visible:border-border-subtle"
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
        className="flex flex-col gap-(--space-3)"
        aria-label={t(readOnly ? "historySectionTitle" : "pendingSectionTitle")}
      >
        <SectionHeader
          title={t(readOnly ? "historySectionTitle" : "pendingSectionTitle")}
          description={t(
            readOnly ? "historySectionBody" : "pendingSectionBody",
          )}
        />

        {filtered.length === 0 ? (
          <EmptyState
            title={t("filterEmptyTitle")}
            description={t("filterEmptyBody")}
            className="rounded-[var(--radius-card)] border border-dashed border-border-subtle bg-surface/60 px-(--space-4) py-(--space-5)"
          />
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            <AnimatePresence initial={false} mode="popLayout">
              {filtered.map((item) => {
                if (!item.kind) return null;
                const visual = itemVisual(item.kind);
                const localizedCategory = item.categoryName
                  ? localizeCatalogName(tCatalog, "tags", item.categoryName) ||
                    item.categoryName
                  : null;
                const title =
                  item.note?.trim() ||
                  localizedCategory ||
                  item.displayTitle ||
                  t(`kinds.${item.kind}`);
                const detailParts = [
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
                ].filter(Boolean);
                let lifecycleKey:
                  | "lifecycleDue"
                  | "lifecycleMaturity"
                  | "lifecycleExpires"
                  | null = null;
                if (item.lifecycleContext === InboxLifecycleContext.DUE)
                  lifecycleKey = "lifecycleDue";
                if (item.lifecycleContext === InboxLifecycleContext.MATURITY)
                  lifecycleKey = "lifecycleMaturity";
                if (item.lifecycleContext === InboxLifecycleContext.EXPIRES)
                  lifecycleKey = "lifecycleExpires";
                const lifecycleLabel =
                  item.lifecycleDate && lifecycleKey
                    ? `${item.lifecycleOverdue ? t("lifecycleOverdue") : t(lifecycleKey)}: ${formatDate(new Date(item.lifecycleDate), locale)}`
                    : null;
                const unread = item.readAt == null;
                const card = (
                  <ReviewCard
                    title={title}
                    kindLabel={
                      readOnly
                        ? t(`statuses.${item.status}`)
                        : t(`kinds.${item.kind}`)
                    }
                    amountLabel={
                      <FinancialValue dataTestId="inbox-amount">
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
                    statusTone={readOnly ? "neutral" : visual.statusTone}
                    actionLabel={
                      readOnly ? t("historyItemLabel") : t("nextStepLabel")
                    }
                    subtitle={
                      lifecycleLabel
                        ? `${lifecycleLabel}${detailParts.length > 0 ? ` · ${detailParts.join(" · ")}` : ""}`
                        : readOnly
                          ? detailParts.length > 0
                            ? `${detailParts.join(" · ")} · ${t(`statuses.${item.status}`)}`
                            : t(`statuses.${item.status}`)
                          : item.capability ===
                              InboxSourceCapability.READ_ONLY_FORMER_OWNER
                            ? t("ownerUnavailableHint")
                            : item.capability ===
                                InboxSourceCapability.READ_ONLY_NON_OWNER
                              ? t("ownerRequiredHint")
                              : item.capability ===
                                  InboxSourceCapability.SOURCE_UNAVAILABLE
                                ? t("sourceUnavailableHint")
                                : detailParts.length > 0
                                  ? detailParts.join(" · ")
                                  : t("openHint")
                    }
                    data-testid={`inbox-item-${item.id}`}
                    className={
                      readOnly
                        ? "bg-surface-muted/60 shadow-none"
                        : item.readAt == null
                          ? "border-primary/40"
                          : undefined
                    }
                  />
                );

                return (
                  <motion.li
                    key={item.id}
                    initial={
                      policy.enabled
                        ? { opacity: 0, y: motionTokens.distance.sm }
                        : false
                    }
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
                        aria-label={`${title} · ${unread ? t("unreadLabel") : t("readLabel")}`}
                        className="block rounded-[var(--radius-card)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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
