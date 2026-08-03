"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { inboxItemPath } from "@/modules/tenancy/application/app-path";
import { InboxItemKind } from "@/modules/inbox/application/inbox-constants";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";
import { formatCurrency } from "@/shared/i18n/formatters";
import { ReviewCard } from "@/shared/patterns/review-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { TextField } from "@/shared/ui/form";
import { Text } from "@/shared/ui/text";

type KindFilter =
  | "all"
  | typeof InboxItemKind.UNMAPPED_EXPENSE
  | typeof InboxItemKind.INCOME_SUGGEST
  | typeof InboxItemKind.SAVINGS_MATURITY
  | typeof InboxItemKind.EMI_COMPLETE;

type Props = {
  items: InboxReviewItem[];
  locale: string;
};

export function InboxQueueList({ items, locale }: Props) {
  const t = useTranslations("inbox");
  const searchId = useId();
  const [kind, setKind] = useState<KindFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (kind !== "all" && item.kind !== kind) return false;
      if (!q) return true;
      return item.title.toLowerCase().includes(q);
    });
  }, [items, kind, query]);

  const filters: { id: KindFilter; label: string }[] = [
    { id: "all", label: t("filterAll") },
    {
      id: InboxItemKind.UNMAPPED_EXPENSE,
      label: t("kinds.unmapped_expense"),
    },
    {
      id: InboxItemKind.INCOME_SUGGEST,
      label: t("kinds.income_suggest"),
    },
    {
      id: InboxItemKind.SAVINGS_MATURITY,
      label: t("kinds.savings_maturity"),
    },
    {
      id: InboxItemKind.EMI_COMPLETE,
      label: t("kinds.emi_complete"),
    },
  ];

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
            <button
              key={filter.id}
              type="button"
              aria-pressed={pressed}
              className={
                pressed
                  ? "min-h-11 rounded-md bg-accent px-(--space-3) text-sm font-medium text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  : "min-h-11 rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              }
              onClick={() => setKind(filter.id)}
              data-testid={`inbox-filter-${filter.id}`}
            >
              {filter.label}
            </button>
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
          {filtered.map((item) => (
            <li key={item.id}>
              <Link
                href={inboxItemPath(item.id)}
                className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                data-testid={`inbox-item-link-${item.id}`}
              >
                <ReviewCard
                  title={item.title}
                  kindLabel={t(`kinds.${item.kind}`)}
                  amountLabel={formatCurrency(
                    item.amount,
                    item.currency,
                    locale,
                    { maximumFractionDigits: 0 },
                  )}
                  subtitle={t("openHint")}
                  data-testid={`inbox-item-${item.id}`}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Text size="sm" tone="secondary" data-testid="inbox-partner-note">
        {t("partnerEqualNote")}
      </Text>
    </div>
  );
}
