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
  InboxItemKind,
  InboxItemStatus,
  InboxLifecycleContext,
} from "@/modules/inbox/application/inbox-constants";
import { listCaptureJars } from "@/modules/ledger/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { ReviewCard } from "@/shared/patterns/review-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Card } from "@/shared/patterns/card";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { InboxOfflineBanner } from "../inbox-offline-banner";
import { InboxDecisionPanel } from "../inbox-decision-panel";
import { InboxSourceLink } from "../inbox-source-link";
import { InboxReadStateControl } from "../inbox-read-state-control";
import { formatDate } from "@/shared/i18n/formatters";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

type DetailVisual = {
  icon: (typeof FINANCE_ICONS)[keyof typeof FINANCE_ICONS];
  tone: "neutral" | "income" | "expense" | "transfer" | "savings" | "info";
};

const DETAIL_VISUALS: Partial<Record<InboxItemKind, DetailVisual>> = {
  [InboxItemKind.UNMAPPED_EXPENSE]: {
    icon: FINANCE_ICONS.expense,
    tone: "expense",
  },
  [InboxItemKind.INCOME_SUGGEST]: {
    icon: FINANCE_ICONS.income,
    tone: "income",
  },
  [InboxItemKind.SAVINGS_MATURITY]: {
    icon: FINANCE_ICONS.savings,
    tone: "savings",
  },
  [InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION]: {
    icon: FINANCE_ICONS.savings,
    tone: "savings",
  },
  [InboxItemKind.EMI_COMPLETE]: {
    icon: FINANCE_ICONS.loan,
    tone: "info",
  },
  [InboxItemKind.EMERGENCY_DECLARATION]: {
    icon: FINANCE_ICONS.transfer,
    tone: "transfer",
  },
  [InboxItemKind.LOAN_PAYMENT_ATTENTION]: {
    icon: FINANCE_ICONS.loan,
    tone: "info",
  },
  [InboxItemKind.DEBT_PAYMENT_ATTENTION]: {
    icon: FINANCE_ICONS.loan,
    tone: "expense",
  },
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
      >
        <EmptyState
          title={t("notFoundTitle")}
          description={t("notFoundBody")}
          className="rounded-[var(--radius-card)] border border-dashed border-border-subtle bg-surface/60 px-(--space-4) py-(--space-5)"
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
  const displayTitle =
    item.note?.trim() ||
    localizedCategory ||
    item.displayTitle ||
    (item.kind ? t(`kinds.${item.kind}`) : t("title"));
  const detailParts = [
    localizedAccount,
    localizedCategory && item.note?.trim() ? localizedCategory : null,
  ].filter(Boolean);
  const visual = item.kind ? DETAIL_VISUALS[item.kind] : undefined;
  const pending = item.status === InboxItemStatus.PENDING;
  const lifecycleLabel = item.lifecycleDate
    ? `${
        item.lifecycleOverdue
          ? t("lifecycleOverdue")
          : t(
              item.lifecycleContext === InboxLifecycleContext.DUE
                ? "lifecycleDue"
                : item.lifecycleContext === InboxLifecycleContext.MATURITY
                  ? "lifecycleMaturity"
                  : "lifecycleExpires",
            )
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
    >
      <InboxOfflineBanner />

      <Card
        tone={pending ? "highlighted" : "soft"}
        className="gap-(--space-3) p-(--space-4)"
        data-testid="inbox-detail-context"
      >
        <div className="flex items-center justify-between gap-(--space-3)">
          <Text
            size="xs"
            tone="secondary"
            className="font-semibold uppercase tracking-[0.12em]"
          >
            {t("decisionQuestionHeading")}
          </Text>
          <StatusBadge tone={pending ? "warning" : "neutral"}>
            {t(`statuses.${item.status}`)}
          </StatusBadge>
        </div>
        {item.kind ? (
          <Text
            size="sm"
            tone="secondary"
            className="leading-relaxed"
            data-testid="inbox-decision-question"
          >
            {t(`why.${item.kind}`)}
          </Text>
        ) : null}
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
        statusTone={pending ? "warning" : "neutral"}
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
        <Card
          tone="soft"
          className="gap-(--space-2) p-(--space-4)"
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
        </Card>
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
