import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { listHouseholdMembers } from "@/modules/tenancy/application/list-household-members";
import {
  APP_PATH,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { SectionHeader } from "@/shared/patterns/section-header";
import { EmptyState } from "@/shared/patterns/empty-state";
import { MemberList } from "./member-list";

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const t = await getTranslations("together");
  const sessionUser = await getSessionUser();

  if (sessionUser) {
    const membership = await resolveActiveMembership(sessionUser.id);
    if (!membership) {
      return redirect({ href: APP_PATH.ONBOARD, locale });
    }
  }

  const { household, members } = sessionUser
    ? await listHouseholdMembers()
    : { household: null, members: [] };

  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="together-members-page"
    >
      <TopAppBar
        title={t("title")}
        subtitle={
          household ? `${t("householdLabel")}: ${household.name}` : undefined
        }
      />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <section className="flex flex-col gap-(--space-4)">
          <SectionHeader
            title={t("membersTitle")}
            description={t("membersDescription")}
          />
          {members.length > 0 ? (
            <MemberList
              members={members}
              youLabel={t("you")}
              roleAdminLabel={t("roleAdmin")}
              rolePartnerLabel={t("rolePartner")}
            />
          ) : (
            <EmptyState
              title={t("emptyMembersTitle")}
              description={t("emptyMembersDescription")}
              className="flex-none py-(--space-6)"
            />
          )}
          {sessionUser && household ? (
            <div className="flex flex-col gap-(--space-2)">
              <Link
                href={TOGETHER_PATH.INVITATIONS}
                data-testid="together-invite-cta"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-(--space-4) text-sm font-medium text-accent-fg"
              >
                {t("inviteCta")}
              </Link>
              <Link
                href={TOGETHER_PATH.INVITATIONS}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
              >
                {t("invitationsLink")}
              </Link>
              <Link
                href={TOGETHER_PATH.POLICIES}
                data-testid="together-policies-link"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
              >
                {t("policiesLink")}
              </Link>
              <Link
                href={TOGETHER_PATH.PREFERENCES}
                data-testid="together-preferences-link"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
              >
                {t("preferencesLink")}
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
