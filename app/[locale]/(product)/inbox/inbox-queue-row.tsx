"use client";

import { useTranslations } from "next-intl";
import { inboxItemPath } from "@/modules/tenancy/application/app-path";
import {
  InboxItemKind,
  inboxItemTestId,
} from "@/modules/inbox/application/inbox-constants";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { formatDate, formatPercent } from "@/shared/i18n/formatters";
import { InboxRow } from "@/shared/patterns/inbox-row";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { InboxFinancialAmount } from "./inbox-financial-amount";
import {
  inboxAmountKind,
  inboxAmountLabel,
  inboxAmountTone,
  inboxDisplayTitle,
  inboxItemVisual,
  inboxLifecycleLabelKey,
  inboxOwnershipHintKey,
  inboxQueueDominantTitle,
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
  const accountName = item.accountName
    ? localizeCatalogName(tCatalog, "accounts", item.accountName) ||
      item.accountName
    : null;
  const dominant = inboxQueueDominantTitle({
    kind: item.kind,
    displayTitle,
    accountName,
  });
  const maturityRate =
    item.typed?.type === InboxItemKind.SAVINGS_MATURITY
      ? item.typed.payload.currentRate
      : null;
  // ponytail: omit the mapper's default 0; model rate presence before showing a real 0% rate.
  const maturityRateLabel =
    maturityRate != null && Number.isFinite(maturityRate) && maturityRate > 0
      ? `${t("factRate")}: ${formatPercent(maturityRate / 100, locale, { maximumFractionDigits: 2 })}`
      : null;
  const detailParts = [
    item.kind === InboxItemKind.SAVINGS_MATURITY ? null : accountName,
    maturityRateLabel,
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

  return (
    <InboxRow
      presentation="card"
      accent={readOnly ? "neutral" : visual.accent}
      title={dominant.title}
      subtitle={inboxQueueRowSubtitle({
        lifecycleLabel,
        ownershipHint: ownershipHintKey ? t(ownershipHintKey) : null,
        detailParts,
      })}
      categoryBadge={
        <StatusBadge
          tone={readOnly ? StatusBadgeTone.NEUTRAL : visual.statusTone}
        >
          {kindLabel}
        </StatusBadge>
      }
      unread={unread}
      actionLabel={readOnly ? undefined : t("nextStepLabel")}
      impactAmountContent={
        amountLabel ? (
          <InboxFinancialAmount
            amountLabel={amountLabel}
            kind={inboxAmountKind(item.kind)}
            tone={inboxAmountTone(item.kind)}
          />
        ) : undefined
      }
      leading={
        <IconContainer tone={visual.tone} size="sm">
          <AppIcon icon={visual.icon} size="sm" />
        </IconContainer>
      }
      href={readOnly ? undefined : inboxItemPath(item.id)}
      aria-label={`${dominant.title} · ${kindLabel} · ${unread ? t("unreadLabel") : t("readLabel")}${readOnly ? "" : ` · ${t("nextStepLabel")}`}`}
      data-testid={inboxItemTestId(item.id)}
    />
  );
}
