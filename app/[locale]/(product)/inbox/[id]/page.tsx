import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getInboxItem } from "@/modules/inbox/application";
import { InboxItemStatus } from "@/modules/inbox/application/inbox-constants";
import { listCaptureJars } from "@/modules/ledger/application";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { ReviewCard } from "@/shared/patterns/review-card";
import { Card } from "@/shared/patterns/card";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { InboxOfflineBanner } from "../inbox-offline-banner";
import { InboxDecisionPanel } from "../inbox-decision-panel";
import { InboxSourceLink } from "../inbox-source-link";
import { InboxReadStateControl } from "../inbox-read-state-control";
import { InboxFactRow, InboxFactsCard } from "../inbox-facts";
import { InboxPrivacyToggle } from "../inbox-privacy-toggle";
import { InboxUnavailable } from "../inbox-unavailable";
import {
  inboxDisplayTitle,
  inboxItemVisual,
  inboxLifecycleLabelKey,
} from "../inbox-presentations";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

/**
 * inbox.review-detail — resolve / dismiss / acknowledge (ST-E06-002 / F4).
 */
export default async function InboxItemDetailPage({ params }: Props) {
  const { locale: rawLocale, id } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) {
    return redirect({ href: APP_PATH.LOGIN, locale });
  }
  const membership = await resolveActiveMembership(user.id);
  if (!membership) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  const [t, tCatalog, item, jars] = await Promise.all([
    getTranslations("inbox"),
    getTranslations("catalog"),
    getInboxItem(id),
    listCaptureJars(),
  ]);

  if (!item) {
    return (
      <Page
        testId="inbox-detail-missing"
        topBar={
          <TopAppBar
            variant="detail"
            title={t("detailTitle")}
            subtitle={t("detailSubtitle")}
            backHref={APP_PATH.INBOX}
            backLabel={t("backToQueue")}
          />
        }
        contentClassName="gap-(--space-5)"
      >
        <InboxUnavailable
          title={t("notFoundTitle")}
          description={t("notFoundBody")}
          actionHref={APP_PATH.INBOX}
          actionLabel={t("backToQueue")}
          testId="inbox-missing-back"
        />
      </Page>
    );
  }

  const activeJars = jars ?? [];
  const localizedCategory = item.categoryName
    ? localizeCatalogName(tCatalog, "tags", item.categoryName) ||
      item.categoryName
    : null;
  const localizedAccount = item.accountName
    ? localizeCatalogName(tCatalog, "accounts", item.accountName) ||
      item.accountName
    : null;
  const displayTitle = inboxDisplayTitle({
    note: item.note,
    localizedCategory,
    displayTitle: item.displayTitle,
    kindLabel: item.kind ? t(`kinds.${item.kind}`) : t("title"),
  });
  const detailParts = [
    localizedAccount,
    localizedCategory && item.note?.trim() ? localizedCategory : null,
  ].filter(Boolean);
  const visual = item.kind ? inboxItemVisual(item.kind) : undefined;
  const pending = item.status === InboxItemStatus.PENDING;
  const lifecycleKey = inboxLifecycleLabelKey(item.lifecycleContext);
  const lifecycleLabel = item.lifecycleDate
    ? `${
        item.lifecycleOverdue
          ? t("lifecycleOverdue")
          : lifecycleKey
            ? t(lifecycleKey)
            : t("lifecycleExpires")
      }: ${formatDate(new Date(item.lifecycleDate), locale)}`
    : null;

  return (
    <Page
      testId="inbox-detail"
      topBar={
        <TopAppBar
          variant="detail"
          title={t("detailTitle")}
          subtitle={t("detailSubtitle")}
          backHref={APP_PATH.INBOX}
          backLabel={t("backToQueue")}
        />
      }
      contentClassName="gap-(--space-5)"
    >
      <InboxOfflineBanner />

      <Card
        tone={pending ? "highlighted" : "soft"}
        className="gap-(--space-3) p-(--space-4)"
        data-testid="inbox-detail-context"
      >
        <div className="flex items-start justify-between gap-(--space-3)">
          <div className="min-w-0">
            <Text size="sm" weight="semibold" className="text-text-primary">
              {t("decisionQuestionHeading")}
            </Text>
            {item.kind ? (
              <Text
                size="sm"
                tone="secondary"
                className="mt-(--space-1) leading-relaxed"
                data-testid="inbox-decision-question"
              >
                {t(`why.${item.kind}`)}
              </Text>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-(--space-2)">
            <StatusBadge
              tone={pending ? StatusBadgeTone.WARNING : StatusBadgeTone.NEUTRAL}
            >
              {t(`statuses.${item.status}`)}
            </StatusBadge>
            <InboxPrivacyToggle testId="inbox-detail-privacy-toggle" />
          </div>
        </div>
        <Text size="xs" tone="muted" data-testid="inbox-partner-equal">
          {t("partnerEqualNote")}
        </Text>
        {lifecycleLabel ? (
          <Text
            size="sm"
            tone="secondary"
            data-testid="inbox-lifecycle-context"
          >
            {lifecycleLabel}
          </Text>
        ) : null}
      </Card>

      <ReviewCard
        title={displayTitle}
        kindLabel={item.kind ? t(`kinds.${item.kind}`) : t("title")}
        amountLabel={
          <FinancialValue dataTestId="inbox-amount">
            {formatCurrency(item.amount, item.currency, locale, {
              maximumFractionDigits: 0,
            })}
          </FinancialValue>
        }
        leading={
          visual ? (
            <IconContainer tone={visual.tone} size="sm">
              <AppIcon icon={visual.icon} size="sm" />
            </IconContainer>
          ) : undefined
        }
        statusTone={pending ? StatusBadgeTone.WARNING : StatusBadgeTone.NEUTRAL}
        subtitle={detailParts.length > 0 ? detailParts.join(" · ") : undefined}
        data-testid="inbox-detail-card"
      />

      <StatusAlert
        variant="info"
        title={t("amountContextTitle")}
        description={t("amountContextBody")}
      />

      {pending ? <InboxDecisionPanel item={item} jars={activeJars} /> : null}

      {localizedCategory || localizedAccount || item.note ? (
        <InboxFactsCard title={t("detailsHeading")} testId="inbox-item-details">
          {localizedCategory ? (
            <InboxFactRow label={t("factCategory")} value={localizedCategory} />
          ) : null}
          {localizedAccount ? (
            <InboxFactRow label={t("factAccount")} value={localizedAccount} />
          ) : null}
          {item.note?.trim() ? (
            <InboxFactRow label={t("factNote")} value={item.note.trim()} />
          ) : null}
        </InboxFactsCard>
      ) : null}

      <InboxSourceLink item={item} />

      <InboxReadStateControl item={item} />

      {!pending ? (
        <Card tone="soft" className="p-(--space-3)">
          <Text size="sm" tone="secondary" data-testid="inbox-archived-status">
            {t(`statuses.${item.status}`)}
          </Text>
        </Card>
      ) : null}
    </Page>
  );
}
