import { getTranslations } from "next-intl/server";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import { listHouseholdMembers } from "@/modules/tenancy/application/list-household-members";
import { listMembershipImpactSummaries } from "@/modules/tenancy/application/membership-lifecycle";
import {
  HOUSEHOLD_ROLE,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
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
  const impactByMemberId = await listMembershipImpactSummaries(
    result.members.map((member) => member.id),
  );
  const activeAdminCount = result.members.filter(
    (member) => member.role === HOUSEHOLD_ROLE.ADMIN,
  ).length;

  return (
    <Page
      testId="together-members-page"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={TOGETHER_PATH.ROOT}
          title={t("membersTitle")}
          subtitle={result.household?.name}
        />
      }
    >
      {result.members.length > 0 ? (
        <MemberList
          members={result.members}
          youLabel={t("you")}
          unnamedFallback={t("unnamedMember")}
          roleAdminLabel={t("roleAdmin")}
          rolePartnerLabel={t("rolePartner")}
          roleAdminHint={t("members.roleAdminHint")}
          rolePartnerHint={t("members.rolePartnerHint")}
          activeLabel={t("members.active")}
          canManageRoles={membership.role === HOUSEHOLD_ROLE.ADMIN}
          canManageMembers={membership.role === HOUSEHOLD_ROLE.ADMIN}
          impactByMemberId={impactByMemberId}
          activeAdminCount={activeAdminCount}
        />
      ) : (
        <EmptyState
          title={t("emptyMembersTitle")}
          description={t("emptyMembersDescription")}
        />
      )}
    </Page>
  );
}
