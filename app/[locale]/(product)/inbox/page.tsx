import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  listOpenInboxItems,
  listArchivedInboxItems,
  runInboxStalenessWorker,
} from "@/modules/inbox/application";
import {
  InboxQueueTab,
  InboxReceiptKind,
  INBOX_RECEIPT_KIND_VALUES,
  INBOX_RECEIPT_QUERY,
  INBOX_TAB_QUERY,
} from "@/modules/inbox/application/inbox-constants";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { Page } from "@/shared/patterns/page";
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
  }

  const [t, items] = await Promise.all([
    getTranslations("inbox"),
    showArchived ? listArchivedInboxItems() : listOpenInboxItems(),
  ]);

  const loadFailed = items == null;
  const list = items ?? [];
  const headerState = showArchived
    ? "archived"
    : list.length === 0
      ? "clear"
      : "open";
  const headerHeadline =
    headerState === "clear"
      ? t("header.headline.clear")
      : headerState === "open"
        ? t("header.headline.open")
        : t("header.headline.archived");
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
          variant="contextual"
          eyebrow={t("header.eyebrow")}
          title={headerHeadline}
          subtitle={headerSupporting}
          icon={NAVIGATION_ICONS.inbox}
          meta={headerMeta}
        />
      }
      contentClassName="gap-(--space-4)"
    >
      <InboxOfflineBanner />

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
        <InboxQueueList items={list} locale={locale} readOnly={showArchived} />
      )}
    </Page>
  );
}
