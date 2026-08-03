import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { listOpenInboxItems } from "@/modules/inbox/application";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { InboxOfflineBanner } from "./inbox-offline-banner";
import { InboxQueueList } from "./inbox-queue-list";

type Props = { params: Promise<{ locale: string }> };

/**
 * inbox.queue — ReviewCard list with kind filter (ST-E06-001 / AC-005 / AC-020).
 */
export default async function InboxPage({ params }: Props) {
  const { locale: rawLocale } = await params;
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

  const [t, tEmpty, items] = await Promise.all([
    getTranslations("inbox"),
    getTranslations("emptyStates"),
    listOpenInboxItems(),
  ]);

  const loadFailed = items == null;
  const pending = items ?? [];

  return (
    <div className="flex min-h-full flex-col" data-testid="inbox-queue">
      <TopAppBar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <InboxOfflineBanner />

        {loadFailed ? (
          <StatusAlert
            variant="danger"
            title={t("loadErrorTitle")}
            description={t("loadErrorBody")}
          />
        ) : pending.length === 0 ? (
          <EmptyState
            title={tEmpty("inboxTitle")}
            description={tEmpty("inboxDescription")}
          />
        ) : (
          <InboxQueueList items={pending} locale={locale} />
        )}
      </div>
    </div>
  );
}
