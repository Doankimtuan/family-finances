import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getInboxItem } from "@/modules/inbox/application";
import { listCaptureJars } from "@/modules/ledger/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { ReviewCard } from "@/shared/patterns/review-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Text } from "@/shared/ui/text";
import { InboxOfflineBanner } from "../inbox-offline-banner";
import { InboxDecisionPanel } from "../inbox-decision-panel";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

/**
 * inbox.review-detail — resolve / dismiss / acknowledge (ST-E06-002).
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

  const [t, item, jars] = await Promise.all([
    getTranslations("inbox"),
    getInboxItem(id),
    listCaptureJars(),
  ]);

  if (!item) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="inbox-detail-missing"
      >
        <TopAppBar title={t("detailTitle")} subtitle={t("detailSubtitle")} />
        <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
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
        </div>
      </div>
    );
  }

  const activeJars = jars ?? [];

  return (
    <div className="flex min-h-full flex-col" data-testid="inbox-detail">
      <TopAppBar title={t("detailTitle")} subtitle={t("detailSubtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <InboxOfflineBanner />

        <ReviewCard
          title={item.title}
          kindLabel={t(`kinds.${item.kind}`)}
          amountLabel={formatCurrency(item.amount, item.currency, locale, {
            maximumFractionDigits: 0,
          })}
          data-testid="inbox-detail-card"
        />

        <section className="flex flex-col gap-(--space-2)">
          <Text size="sm" className="font-semibold text-text-primary">
            {t("whyHeading")}
          </Text>
          <Text size="sm" tone="secondary">
            {t(`why.${item.kind}`)}
          </Text>
          <Text size="sm" tone="secondary" data-testid="inbox-partner-equal">
            {t("partnerEqualNote")}
          </Text>
        </section>

        <InboxDecisionPanel item={item} jars={activeJars} />

        <Link
          href={APP_PATH.INBOX}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="inbox-back-queue"
        >
          {t("backToQueue")}
        </Link>
      </div>
    </div>
  );
}
