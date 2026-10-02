import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import { listHouseholdMembers } from "@/modules/tenancy/application/list-household-members";
import { listMembershipImpactSummaries } from "@/modules/tenancy/application/membership-lifecycle";
import {
  HOUSEHOLD_ROLE,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import { Card } from "@/shared/patterns/card";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  ACTION_ICONS,
  SAVINGS_PROVIDER_ICONS,
  UTILITY_ICONS,
} from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { memberInitials } from "../together-member-identity";
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
          subtitle={
            result.household?.name
              ? `${result.household.name} · ${t("header.meta", { count: result.members.length })}`
              : undefined
          }
        />
      }
    >
      {/* Boundary Notice Alert matching Stitch SCR-47 */}
      <div className="flex items-start gap-2.5 rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 shadow-2xs dark:border-teal-900/60 dark:bg-teal-950/30">
        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
          <AppIcon icon={UTILITY_ICONS.info} size="xs" />
        </div>
        <Text
          size="xs"
          className="leading-relaxed text-teal-800 dark:text-teal-200"
        >
          {t("membersDescription")}
        </Text>
      </div>

      {/* Household Compact Summary Strip */}
      <Card
        tone="elevated"
        className="flex flex-row items-center justify-between rounded-xl border border-border-subtle p-3 shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 overflow-hidden">
            {result.members.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-100 ring-2 ring-surface text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              >
                {memberInitials(m.email, m.displayName)}
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
              <span>{result.household?.name ?? t("householdLabel")}</span>
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <Text size="xs" tone="muted" className="text-[11px]">
              {t("header.meta", { count: result.members.length })}
            </Text>
          </div>
        </div>
        <AppIcon
          icon={SAVINGS_PROVIDER_ICONS.shield}
          size="sm"
          className="text-text-muted"
        />
      </Card>

      {/* Section Header */}
      <div className="flex items-center justify-between px-0.5 pt-1">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {t("membersTitle")} ({result.members.length})
        </h2>
        <Link
          href={TOGETHER_PATH.POLICIES}
          className="flex items-center gap-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
        >
          {t("policiesLink")}
          <AppIcon icon={ACTION_ICONS.forward} size="xs" />
        </Link>
      </div>

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
