import { after } from "next/server";
import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
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
  InboxQueueHeaderState,
  InboxQueueTab,
  InboxReceiptKind,
  INBOX_RECEIPT_KIND_VALUES,
  INBOX_RECEIPT_QUERY,
  INBOX_TAB_QUERY,
  INBOX_TEST_ID,
} from "@/modules/inbox/application/inbox-constants";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { InboxOfflineBanner } from "./inbox-offline-banner";
import { InboxQueueList } from "./inbox-queue-list";
import { InboxQueueTabs } from "./inbox-queue-tabs";
import {
  InboxQueueBodyPending,
  InboxQueueHeaderPending,
  InboxQueueTransition,
} from "./inbox-queue-transition";
import { InboxSummary } from "./inbox-summary";
import { InboxUnavailable } from "./inbox-unavailable";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; receipt?: string }>;
};

type InboxCopy = Awaited<ReturnType<typeof getTranslations<"inbox">>>;

function resolveInboxHeadline(
  state: InboxQueueHeaderState,
  itemCount: number,
  t: InboxCopy,
): string {
  switch (state) {
    case InboxQueueHeaderState.CLEAR:
      return t("header.headline.clear");
    case InboxQueueHeaderState.OPEN:
      return t("header.headline.open", { count: itemCount });
    case InboxQueueHeaderState.ARCHIVED:
      return itemCount === 0
        ? t("header.meta.archived")
        : t("header.headline.archived", { count: itemCount });
  }
}

function resolveInboxSummaryFacts(
  state: InboxQueueHeaderState,
  itemCount: number,
  t: InboxCopy,
): { label: string; value: string }[] {
  if (state === InboxQueueHeaderState.OPEN) {
    return [
      {
        label: t("facts.waiting"),
        value: t("header.meta.open", { count: itemCount }),
      },
    ];
  }
  if (state === InboxQueueHeaderState.ARCHIVED && itemCount > 0) {
    return [
      {
        label: t("facts.archived"),
        value: t("sectionCount", { count: itemCount }),
      },
    ];
  }
  return [];
}

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

  const backgroundClientPromise = showArchived
    ? Promise.resolve(null)
    : createSupabaseServerClient();
  const [t, items, backgroundClient] = await Promise.all([
    getTranslations("inbox"),
    showArchived ? listArchivedInboxItems() : listOpenInboxPage(),
    backgroundClientPromise,
  ]);

  // Best-effort sweep — run after the Inbox response to avoid competing with
  // the initial list query (BR-15).
  if (!showArchived && backgroundClient) {
    const workerContext = {
      client: backgroundClient,
      householdId: membership.householdId,
    };
    after(async () => {
      await Promise.allSettled([
        runInboxStalenessWorker(workerContext),
        syncLoanDebtAttentionInboxItems(workerContext),
      ]);
    });
  }

  const loadFailed = items == null;
  const archivedItems = Array.isArray(items) ? items : null;
  const list =
    archivedItems ?? (items && !Array.isArray(items) ? items.items : []);
  const nextCursor =
    !showArchived && items && !Array.isArray(items) ? items.nextCursor : null;
  const headerState = showArchived
    ? InboxQueueHeaderState.ARCHIVED
    : list.length === 0
      ? InboxQueueHeaderState.CLEAR
      : InboxQueueHeaderState.OPEN;
  const headerSupporting =
    headerState === InboxQueueHeaderState.CLEAR
      ? t("header.supporting.clear")
      : headerState === InboxQueueHeaderState.OPEN
        ? t("header.supporting.open")
        : t("header.supporting.archived");
  const headerMeta =
    headerState === InboxQueueHeaderState.OPEN
      ? t("header.meta.open", { count: list.length })
      : headerState === InboxQueueHeaderState.CLEAR
        ? t("header.meta.clear")
        : t("header.meta.archived");
  const headline = resolveInboxHeadline(headerState, list.length, t);
  const summaryFacts = resolveInboxSummaryFacts(headerState, list.length, t);
  const activeTab = showArchived ? InboxQueueTab.ARCHIVED : InboxQueueTab.OPEN;

  return (
    <Page
      testId={INBOX_TEST_ID.QUEUE}
      topBar={
        <TopAppBar
          variant="primary"
          eyebrow={t("header.eyebrow")}
          title={t("title")}
          meta={headerMeta}
        />
      }
      contentClassName="gap-(--space-5)"
    >
      <InboxQueueTransition tab={activeTab}>
        <InboxOfflineBanner />

        <InboxQueueHeaderPending>
          <InboxSummary
            state={headerState}
            headline={headline}
            supporting={headerSupporting}
            facts={summaryFacts}
          />

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
        </InboxQueueHeaderPending>

        <InboxQueueTabs />

        <InboxQueueBodyPending>
          {loadFailed ? (
            <InboxUnavailable
              title={t("loadErrorTitle")}
              description={t("loadErrorBody")}
              actionHref={APP_PATH.INBOX}
              actionLabel={t("retry")}
              testId="inbox-retry"
            />
          ) : list.length === 0 ? (
            <EmptyState
              title={
                showArchived ? t("archivedEmptyTitle") : t("emptyOpenTitle")
              }
              description={
                showArchived ? t("archivedEmptyBody") : t("emptyOpenBody")
              }
              icon={
                <AppIcon
                  icon={NAVIGATION_ICONS.inbox}
                  size={AppIconSize.DISPLAY}
                />
              }
              className="flex-none py-(--space-4)"
            />
          ) : (
            <InboxQueueList
              items={list}
              locale={locale}
              readOnly={showArchived}
              nextCursor={nextCursor}
            />
          )}
        </InboxQueueBodyPending>
      </InboxQueueTransition>
    </Page>
  );
}
