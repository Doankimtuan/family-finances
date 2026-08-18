"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { inboxItemPath } from "@/modules/tenancy/application/app-path";
import { INBOX_ITEM_KIND_VALUES } from "@/modules/inbox/application/inbox-constants";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { ReviewCard } from "@/shared/patterns/review-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { FilterChip } from "@/shared/patterns/filter-chip";
import { TextField } from "@/shared/ui/form";
import { Text } from "@/shared/ui/text";

type KindFilter = "all" | (typeof INBOX_ITEM_KIND_VALUES)[number];

type Props = {
  items: InboxReviewItem[];
  locale: string;
  readOnly?: boolean;
};

/** Canonical kinds surfaced as queue filters (Prompt 13A: no hardcoded subset). */
const KIND_FILTERS: readonly KindFilter[] = ["all", ...INBOX_ITEM_KIND_VALUES];

export function InboxQueueList({ items, locale, readOnly = false }: Props) {
  const t = useTranslations("inbox");
  const tCatalog = useTranslations("catalog");
  const searchId = useId();
  const [kind, setKind] = useState<KindFilter>("all");
  const [query, setQuery] = useState("");

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
      className="flex flex-col gap-(--space-4)"
      data-testid="inbox-queue-list"
    >
      <TextField
        id={searchId}
        label={t("searchLabel")}
        type="search"
        value={query}
        placeholder={t("searchPlaceholder")}
        onChange={(e) => setQuery(e.target.value)}
        data-testid="inbox-search"
      />

      <div
        className="flex flex-wrap gap-(--space-2)"
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
              data-testid={`inbox-filter-${filter.id}`}
            >
              {filter.label}
            </FilterChip>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={t("filterEmptyTitle")}
          description={t("filterEmptyBody")}
          className="flex-none py-(--space-4)"
        />
      ) : (
        <ul className="flex flex-col gap-(--space-3)">
          {filtered.map((item) => {
            if (!item.kind) return null;
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
                ? localizeCatalogName(tCatalog, "accounts", item.accountName) ||
                  item.accountName
                : null,
              localizedCategory && item.note?.trim() ? localizedCategory : null,
            ].filter(Boolean);
            const card = (
              <ReviewCard
                title={title}
                kindLabel={t(`kinds.${item.kind}`)}
                amountLabel={formatCurrency(
                  item.amount,
                  item.currency,
                  locale,
                  { maximumFractionDigits: 0 },
                )}
                subtitle={
                  readOnly
                    ? t(`statuses.${item.status}`)
                    : item.ownerUnavailable
                      ? t("ownerUnavailableHint")
                      : detailParts.length > 0
                        ? detailParts.join(" · ")
                        : t("openHint")
                }
                data-testid={`inbox-item-${item.id}`}
              />
            );

            return (
              <li key={item.id}>
                {readOnly || item.ownerUnavailable ? (
                  card
                ) : (
                  <Link
                    href={inboxItemPath(item.id)}
                    className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    data-testid={`inbox-item-link-${item.id}`}
                  >
                    {card}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {readOnly ? null : (
        <Text size="sm" tone="secondary" data-testid="inbox-partner-note">
          {t("partnerEqualNote")}
        </Text>
      )}
    </div>
  );
}
