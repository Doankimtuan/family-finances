import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import { listHouseholdMembers } from "@/modules/tenancy/application/list-household-members";
import {
  HOUSEHOLD_ROLE,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { SectionHeader } from "@/shared/patterns/section-header";
import { EmptyState } from "@/shared/patterns/empty-state";
import { MemberList } from "../member-list";

type Props = { params: Promise<{ locale: string }> };

export default async function MembersPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const { membership } = await requireTogetherMembership({
    localeParam,
    nextPath: TOGETHER_PATH.MEMBERS,
  });
  const [result, t] = await Promise.all([
    listHouseholdMembers(),
    getTranslations("together"),
  ]);

  return (
    <Page
      testId="together-members-page"
      topBar={
        <TopAppBar
          title={t("membersTitle")}
          subtitle={result.household?.name}
        />
      }
    >
      <section className="flex flex-col gap-(--space-4)">
        <SectionHeader
          title={t("membersTitle")}
          description={t("membersDescription")}
        />
        {result.members.length > 0 ? (
          <MemberList
            members={result.members}
            youLabel={t("you")}
            roleAdminLabel={t("roleAdmin")}
            rolePartnerLabel={t("rolePartner")}
            canManageRoles={membership.role === HOUSEHOLD_ROLE.ADMIN}
          />
        ) : (
          <EmptyState
            title={t("emptyMembersTitle")}
            description={t("emptyMembersDescription")}
          />
        )}
      </section>
      <Link
        href={TOGETHER_PATH.ROOT}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {t("members.back")}
      </Link>
    </Page>
  );
}
