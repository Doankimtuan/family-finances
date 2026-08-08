import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getInboxItem } from "@/modules/inbox/application";
import { InboxItemStatus } from "@/modules/inbox/application/inbox-constants";
import { listCaptureJars } from "@/modules/ledger/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { ReviewCard } from "@/shared/patterns/review-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { InboxOfflineBanner } from "../inbox-offline-banner";
import { InboxDecisionPanel } from "../inbox-decision-panel";
import { InboxSourceLink } from "../inbox-source-link";

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
          <TopAppBar title={t("detailTitle")} subtitle={t("detailSubtitle")} />
        }
      >
        <EmptyState
          title={t("notFoundTitle")}
          description={t("notFoundBody")}
          className="flex-none py-(--space-4)"
        />
        <Link
          href={APP_PATH.INBOX}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("backToQueue")}
        </Link>
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
  const displayTitle =
    item.note?.trim() ||
    localizedCategory ||
    item.displayTitle ||
    t(`kinds.${item.kind}`);
  const detailParts = [
    localizedAccount,
    localizedCategory && item.note?.trim() ? localizedCategory : null,
  ].filter(Boolean);

  return (
    <Page
      testId="inbox-detail"
      topBar={
        <TopAppBar title={t("detailTitle")} subtitle={t("detailSubtitle")} />
      }
    >
      <InboxOfflineBanner />

      <section className="flex flex-col gap-(--space-2)">
        <Text size="sm" className="font-semibold text-text-primary">
          {t("decisionQuestionHeading")}
        </Text>
        <Text size="sm" tone="secondary" data-testid="inbox-decision-question">
          {t(`why.${item.kind}`)}
        </Text>
        <Text size="sm" tone="secondary" data-testid="inbox-partner-equal">
          {t("partnerEqualNote")}
        </Text>
      </section>

      <ReviewCard
        title={displayTitle}
        kindLabel={
          item.type ? t(`types.${item.type}`) : t(`kinds.${item.kind}`)
        }
        amountLabel={formatCurrency(item.amount, item.currency, locale, {
          maximumFractionDigits: 0,
        })}
        subtitle={
          detailParts.length > 0
            ? detailParts.join(" · ")
            : item.type
              ? t("typeHeader", { type: t(`types.${item.type}`) })
              : undefined
        }
        data-testid="inbox-detail-card"
      />
      <StatusAlert
        variant="info"
        title={t("amountContextTitle")}
        description={t("amountContextBody")}
      />

      {localizedCategory || localizedAccount || item.note ? (
        <section
          className="flex flex-col gap-(--space-2)"
          data-testid="inbox-item-details"
        >
          <Text size="sm" className="font-semibold text-text-primary">
            {t("detailsHeading")}
          </Text>
          {localizedCategory ? (
            <Text size="sm" tone="secondary">
              {t("detailCategory", { name: localizedCategory })}
            </Text>
          ) : null}
          {localizedAccount ? (
            <Text size="sm" tone="secondary">
              {t("detailAccount", { name: localizedAccount })}
            </Text>
          ) : null}
          {item.note?.trim() ? (
            <Text size="sm" tone="secondary">
              {t("detailNote", { note: item.note.trim() })}
            </Text>
          ) : null}
        </section>
      ) : null}

      <InboxSourceLink item={item} />

      {item.status === InboxItemStatus.PENDING ? (
        <InboxDecisionPanel item={item} jars={activeJars} />
      ) : (
        <Text size="sm" tone="secondary" data-testid="inbox-archived-status">
          {t(`statuses.${item.status}`)}
        </Text>
      )}

      <Link
        href={APP_PATH.INBOX}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        data-testid="inbox-back-queue"
      >
        {t("backToQueue")}
      </Link>
    </Page>
  );
}
