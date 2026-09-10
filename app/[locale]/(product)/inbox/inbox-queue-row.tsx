"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { inboxItemPath } from "@/modules/tenancy/application/app-path";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { formatDate } from "@/shared/i18n/formatters";
import { ReviewCard, ReviewCardDensity } from "@/shared/patterns/review-card";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { StatusBadgeTone } from "@/shared/ui/status-badge";
import { INBOX_REVIEW_ROW_CLASS } from "./inbox-chrome";
import { InboxFinancialAmount } from "./inbox-financial-amount";
import {
  inboxAmountKind,
  inboxAmountLabel,
  inboxDisplayTitle,
  inboxItemVisual,
  inboxLifecycleLabelKey,
  inboxOwnershipHintKey,
  inboxQueueDominantTitle,
  inboxQueueLifecycleLabel,
  inboxQueueRowSubtitle,
} from "./inbox-presentations";

type InboxQueueRowProps = {
  item: InboxReviewItem;
  locale: string;
  readOnly: boolean;
};

export function InboxQueueRow({ item, locale, readOnly }: InboxQueueRowProps) {
  const t = useTranslations("inbox");
  const tCatalog = useTranslations("catalog");

  if (!item.kind) return null;

  const visual = inboxItemVisual(item.kind);
  const localizedCategory = item.categoryName
    ? localizeCatalogName(tCatalog, "tags", item.categoryName) ||
      item.categoryName
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
  const detailParts = [
    dominant.context,
    item.accountName
      ? localizeCatalogName(tCatalog, "accounts", item.accountName) ||
        item.accountName
      : null,
    localizedCategory && item.note?.trim() ? localizedCategory : null,
  ].filter((part): part is string => Boolean(part));
  const lifecycleKey = inboxLifecycleLabelKey(item.lifecycleContext);
  const lifecycleLabel =
    item.lifecycleDate && lifecycleKey
      ? `${item.lifecycleOverdue ? t("lifecycleOverdue") : t(lifecycleKey)}: ${formatDate(new Date(item.lifecycleDate), locale)}`
      : null;
  const ownershipHintKey = readOnly
    ? null
    : inboxOwnershipHintKey(item.capability);
  const unread = item.readAt == null;
  const amountLabel = inboxAmountLabel(item.amount, item.currency, locale);
  const kindLabel = readOnly
    ? t(`statuses.${item.status}`)
    : t(`kinds.${item.kind}`);

  const card = (
    <ReviewCard
      density={ReviewCardDensity.ROW}
      showChevron={!readOnly}
      unread={!readOnly && unread}
      title={dominant.title}
      kindLabel={kindLabel}
      amountLabel={
        amountLabel ? (
          <InboxFinancialAmount
            amountLabel={amountLabel}
            kind={inboxAmountKind(item.kind)}
          />
        ) : null
      }
      leading={
        <IconContainer tone={visual.tone} size="sm">
          <AppIcon icon={visual.icon} size="sm" />
        </IconContainer>
      }
      statusTone={readOnly ? StatusBadgeTone.NEUTRAL : visual.statusTone}
      subtitle={inboxQueueRowSubtitle({
        lifecycleLabel: inboxQueueLifecycleLabel({
          context: item.lifecycleContext,
          label: lifecycleLabel,
        }),
        ownershipHint: ownershipHintKey ? t(ownershipHintKey) : null,
        detailParts,
      })}
      data-testid={`inbox-item-${item.id}`}
    />
  );

  if (readOnly) return card;

  return (
    <Link
      href={inboxItemPath(item.id)}
      aria-label={`${displayTitle} · ${unread ? t("unreadLabel") : t("readLabel")}`}
      className={INBOX_REVIEW_ROW_CLASS}
      data-testid={`inbox-item-link-${item.id}`}
    >
      {card}
    </Link>
  );
}
