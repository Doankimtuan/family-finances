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
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { InboxOfflineBanner } from "./inbox-offline-banner";
import { InboxQueueList } from "./inbox-queue-list";
import { InboxQueueTabs } from "./inbox-queue-tabs";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
};

/**
 * inbox.queue — ReviewCard list with kind filter + Archived tab (ST-E03).
 */
export default async function InboxPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params;
  const { tab: rawTab } = await searchParams;
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

  const showArchived = rawTab === "archived";

  // Best-effort sweep — do not block Inbox render / navigation (BR-15).
  if (!showArchived) {
    void runInboxStalenessWorker();
  }

  const [t, tEmpty, items] = await Promise.all([
    getTranslations("inbox"),
    getTranslations("emptyStates"),
    showArchived ? listArchivedInboxItems() : listOpenInboxItems(),
  ]);

  const loadFailed = items == null;
  const list = items ?? [];

  return (
    <div className="flex min-h-full flex-col" data-testid="inbox-queue">
      <TopAppBar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <InboxOfflineBanner />

        <InboxQueueTabs active={showArchived ? "archived" : "open"} />

        {loadFailed ? (
          <StatusAlert
            variant="danger"
            title={t("loadErrorTitle")}
            description={t("loadErrorBody")}
          />
        ) : list.length === 0 ? (
          <EmptyState
            title={
              showArchived ? t("archivedEmptyTitle") : tEmpty("inboxTitle")
            }
            description={
              showArchived ? t("archivedEmptyBody") : tEmpty("inboxDescription")
            }
          />
        ) : (
          <InboxQueueList
            items={list}
            locale={locale}
            readOnly={showArchived}
          />
        )}
      </div>
    </div>
  );
}
