import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getInboxItem } from "@/modules/inbox/application";
import {
  InboxItemStatus,
  INBOX_TEST_ID,
} from "@/modules/inbox/application/inbox-constants";
import { listCaptureJars } from "@/modules/ledger/application";
import { formatDate } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Card } from "@/shared/patterns/card";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { InboxFinancialAmount } from "../inbox-financial-amount";
import { InboxOfflineBanner } from "../inbox-offline-banner";
import { InboxDecisionPanel } from "../inbox-decision-panel";
import { InboxSourceLink } from "../inbox-source-link";
import { InboxReadStateControl } from "../inbox-read-state-control";
import { InboxFactRow, InboxFactsCard } from "../inbox-facts";
import { InboxUnavailable } from "../inbox-unavailable";
import { InboxDetailContext, InboxDetailSource } from "../inbox-detail-context";
import { InboxDetailMeta } from "../inbox-detail-meta";
import {
  inboxAmountKind,
  inboxAmountLabel,
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
        testId={INBOX_TEST_ID.DETAIL_MISSING}
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
        <InboxUnavailable
          title={t("notFoundTitle")}
          description={t("notFoundBody")}
          actionHref={APP_PATH.INBOX}
          actionLabel={t("backToQueue")}
          testId={INBOX_TEST_ID.MISSING_BACK}
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
  const amountLabel = inboxAmountLabel(item.amount, item.currency, locale);

  const detailMeta = (
    <InboxDetailMeta>
      <InboxSourceLink item={item} />
      <InboxReadStateControl item={item} />
    </InboxDetailMeta>
  );

  return (
    <Page
      testId={INBOX_TEST_ID.DETAIL}
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

      <InboxDetailContext
        pending={pending}
        heading={t("decisionQuestionHeading")}
        question={item.kind ? t(`why.${item.kind}`) : null}
        statusLabel={t(`statuses.${item.status}`)}
        partnerNote={t("partnerEqualNote")}
        lifecycleLabel={lifecycleLabel}
      />

      <InboxDetailSource
        title={displayTitle}
        kindLabel={item.kind ? t(`kinds.${item.kind}`) : t("title")}
        amountLabel={
          amountLabel ? (
            <InboxFinancialAmount
              amountLabel={amountLabel}
              kind={inboxAmountKind(item.kind)}
              className="text-xl"
            />
          ) : null
        }
        leading={
          visual ? (
            <IconContainer tone={visual.tone} size="md">
              <AppIcon icon={visual.icon} size="sm" />
            </IconContainer>
          ) : undefined
        }
        statusTone={pending ? StatusBadgeTone.WARNING : StatusBadgeTone.NEUTRAL}
        subtitle={detailParts.length > 0 ? detailParts.join(" · ") : undefined}
      />

      {amountLabel ? (
        <StatusAlert
          variant="info"
          title={t("amountContextTitle")}
          description={t("amountContextBody")}
        />
      ) : null}

      {localizedCategory || localizedAccount || item.note ? (
        <InboxFactsCard
          title={t("detailsHeading")}
          testId={INBOX_TEST_ID.ITEM_DETAILS}
        >
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

      {detailMeta}

      {pending ? <InboxDecisionPanel item={item} jars={activeJars} /> : null}

      {!pending ? (
        <Card tone="soft" className="p-(--space-4)">
          <Text
            size="sm"
            tone="secondary"
            className="text-pretty"
            data-testid={INBOX_TEST_ID.ARCHIVED_STATUS}
          >
            {t(`statuses.${item.status}`)}
          </Text>
        </Card>
      ) : null}
    </Page>
  );
}
