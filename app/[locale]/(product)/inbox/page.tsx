import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  listOpenInboxPage,
  listArchivedInboxItems,
  runInboxStalenessWorker,
  syncLoanDebtAttentionInboxItems,
} from "@/modules/inbox/application";
import {
  InboxQueueTab,
  InboxReceiptKind,
  INBOX_RECEIPT_KIND_VALUES,
  INBOX_RECEIPT_QUERY,
  INBOX_TAB_QUERY,
} from "@/modules/inbox/application/inbox-constants";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { InboxOfflineBanner } from "./inbox-offline-banner";
import { InboxQueueList } from "./inbox-queue-list";
import { InboxQueueTabs } from "./inbox-queue-tabs";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; receipt?: string }>;
};

/**
 * inbox.queue — ReviewCard list with kind filter + Archived tab (ST-E03 / F4).
 */
export default async function InboxPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params;
  const query = await searchParams;
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

  const showArchived = query[INBOX_TAB_QUERY] === InboxQueueTab.ARCHIVED;
  const rawReceipt = query[INBOX_RECEIPT_QUERY];
  const receipt =
    rawReceipt &&
    (INBOX_RECEIPT_KIND_VALUES as readonly string[]).includes(rawReceipt)
      ? (rawReceipt as (typeof INBOX_RECEIPT_KIND_VALUES)[number])
      : null;

  // Best-effort sweep — do not block Inbox render / navigation (BR-15).
  if (!showArchived) {
    void runInboxStalenessWorker();
    void syncLoanDebtAttentionInboxItems();
  }

  const [t, items] = await Promise.all([
    getTranslations("inbox"),
    showArchived ? listArchivedInboxItems() : listOpenInboxPage(),
  ]);

  const loadFailed = items == null;
  const archivedItems = Array.isArray(items) ? items : null;
  const list =
    archivedItems ?? (items && !Array.isArray(items) ? items.items : []);
  const nextCursor =
    !showArchived && items && !Array.isArray(items) ? items.nextCursor : null;
  const headerState = showArchived
    ? "archived"
    : list.length === 0
      ? "clear"
      : "open";
  const headerSupporting =
    headerState === "clear"
      ? t("header.supporting.clear")
      : headerState === "open"
        ? t("header.supporting.open")
        : t("header.supporting.archived");
  const headerMeta =
    headerState === "open"
      ? t("header.meta.open", { count: list.length })
      : headerState === "clear"
        ? t("header.meta.clear")
        : t("header.meta.archived");

  return (
    <Page
      testId="inbox-queue"
      topBar={
        <TopAppBar
          variant="primary"
          eyebrow={t("header.eyebrow")}
          title={t("title")}
          meta={headerMeta}
        />
      }
      contentClassName="gap-(--space-4)"
    >
      <InboxOfflineBanner />

      <Card
        tone={showArchived || list.length === 0 ? "soft" : "highlighted"}
        className="gap-(--space-2) p-(--space-4)"
        data-testid="inbox-summary"
      >
        <Text
          size="xs"
          tone="secondary"
          className="font-semibold uppercase tracking-[0.12em]"
        >
          {showArchived
            ? t("historySectionTitle")
            : list.length > 0
              ? t("pendingSectionTitle")
              : t("emptyOpenTitle")}
        </Text>
        <Text className="text-lg font-semibold tracking-tight text-text-primary">
          {headerMeta}
        </Text>
        <Text
          size="sm"
          tone="secondary"
          className="max-w-[32rem] leading-relaxed"
        >
          {headerSupporting}
        </Text>
      </Card>

      {receipt === InboxReceiptKind.JAR ? (
        <div data-testid="inbox-receipt-jar">
          <StatusAlert
            variant="success"
            title={t("receiptJarTitle")}
            description={t("receiptJarBody")}
          />
        </div>
      ) : null}
      {receipt === InboxReceiptKind.SAVINGS ? (
        <div data-testid="inbox-receipt-savings">
          <StatusAlert
            variant="success"
            title={t("receiptSavingsTitle")}
            description={t("receiptSavingsBody")}
          />
        </div>
      ) : null}
      {receipt === InboxReceiptKind.ATTENTION ? (
        <div data-testid="inbox-receipt-attention">
          <StatusAlert
            variant="success"
            title={t("receiptAttentionTitle")}
            description={t("receiptAttentionBody")}
          />
        </div>
      ) : null}

      <InboxQueueTabs
        active={showArchived ? InboxQueueTab.ARCHIVED : InboxQueueTab.OPEN}
      />

      {loadFailed ? (
        <StatusAlert
          variant="danger"
          title={t("loadErrorTitle")}
          description={t("loadErrorBody")}
        />
      ) : list.length === 0 ? (
        <EmptyState
          title={showArchived ? t("archivedEmptyTitle") : t("emptyOpenTitle")}
          description={
            showArchived ? t("archivedEmptyBody") : t("emptyOpenBody")
          }
        />
      ) : (
        <InboxQueueList
          items={list}
          locale={locale}
          readOnly={showArchived}
          nextCursor={nextCursor}
        />
      )}
    </Page>
  );
}
