import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import {
  listHouseholdMembers,
  type HouseholdMemberRow,
} from "@/modules/tenancy/application/list-household-members";
import { listPendingInvitations } from "@/modules/tenancy/application/list-pending-invitations";
import {
  HOUSEHOLD_MEMBER_LIMIT,
  HOUSEHOLD_ROLE,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import {
  Card,
  EmptyState,
  Page as ProductPage,
  SectionHeader,
  TogetherNavAppearance,
  TogetherNavGroup,
  TogetherNavRow,
  TogetherPrimaryLink,
  TogetherStatusStrip,
  TogetherStatusTone,
  TopAppBar,
} from "@/shared/patterns";
import { HeaderPill } from "@/shared/patterns/top-app-bar";
import { MotionReveal } from "@/shared/motion";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import {
  ACTION_ICONS,
  FINANCE_ICONS,
  NAVIGATION_ICONS,
  UTILITY_ICONS,
} from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";
import { TogetherMemberPreview } from "./together-member-preview";
import { memberInitials } from "./together-member-identity";

const TOGETHER_HERO_AVATAR_LIMIT = 4;

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const { locale: localeParam } = await params;
  const { membership } = await requireTogetherMembership({
    localeParam,
    nextPath: TOGETHER_PATH.ROOT,
  });
  const [t, result, pendingInvitations] = await Promise.all([
    getTranslations("together"),
    listHouseholdMembers(),
    listPendingInvitations(),
  ]);

  const canInvite =
    membership.role === HOUSEHOLD_ROLE.ADMIN &&
    result.household !== null &&
    result.members.length < HOUSEHOLD_MEMBER_LIMIT;
  const isSoloAdmin =
    membership.role === HOUSEHOLD_ROLE.ADMIN && result.members.length === 1;
  const isAdmin = membership.role === HOUSEHOLD_ROLE.ADMIN;
  const roleLabel = isAdmin ? t("roleAdmin") : t("rolePartner");
  const householdName = result.household?.name ?? t("householdLabel");
  const pendingCount = pendingInvitations.length;

  return (
    <ProductPage
      testId="together-overview-page"
      topBar={
        <TopAppBar
          variant="contextual"
          eyebrow={t("header.eyebrow")}
          title={t("header.headline")}
          subtitle={t("header.supporting")}
          icon={NAVIGATION_ICONS.together}
          status={<HeaderPill tone="info">{roleLabel}</HeaderPill>}
          meta={householdName}
        />
      }
    >
      <MotionReveal>
        <Card tone="hero" className="gap-(--space-4) p-(--space-4)">
          <div className="flex items-start gap-(--space-3)">
            <TogetherHeroAvatars members={result.members} />
            <div className="min-w-0 flex-1">
              <Text size="xs" className="text-hero-muted">
                {t("householdLabel")}
              </Text>
              <Text className="truncate text-xl font-semibold tracking-tight text-pretty text-hero-fg">
                {householdName}
              </Text>
            </div>
          </div>
          <div className="flex items-end justify-between gap-(--space-3) border-t border-white/15 pt-(--space-3)">
            <div>
              <Text size="xs" className="text-hero-muted">
                {t("memberCountLabel")}
              </Text>
              <Text
                className="text-3xl font-semibold tabular-nums tracking-tight text-hero-fg"
                data-testid="together-member-count"
              >
                {result.members.length}
              </Text>
            </div>
            <Text
              size="sm"
              className="max-w-[12rem] text-right text-hero-muted text-pretty"
            >
              {t("roleContext", { role: roleLabel })}
            </Text>
          </div>
        </Card>
      </MotionReveal>

      {isSoloAdmin ? (
        <TogetherStatusStrip tone={TogetherStatusTone.WARNING}>
          <Text size="sm" className="font-semibold text-text-primary">
            {t("householdClosureUnavailableTitle")}
          </Text>
          <Text size="sm" tone="secondary" className="mt-0.5 text-pretty">
            {t("householdClosureUnavailableBody")}
          </Text>
        </TogetherStatusStrip>
      ) : null}

      <section className="flex flex-col gap-(--space-3)">
        <SectionHeader
          title={t("membersTitle")}
          description={t("membersDescription")}
          action={
            <Link
              href={TOGETHER_PATH.MEMBERS}
              data-testid="together-members-link"
            >
              {t("membersLink")}
            </Link>
          }
        />
        {result.members.length > 0 ? (
          <TogetherMemberPreview
            members={result.members}
            youLabel={t("you")}
            roleAdminLabel={t("roleAdmin")}
            rolePartnerLabel={t("rolePartner")}
          />
        ) : (
          <EmptyState
            title={t("emptyMembersTitle")}
            description={t("emptyMembersDescription")}
          />
        )}
      </section>

      {canInvite ? (
        <TogetherPrimaryLink
          href={TOGETHER_PATH.INVITATIONS_NEW}
          testId="together-invite-cta"
        >
          <AppIcon icon={ACTION_ICONS.add} size="sm" />
          {t("inviteCta")}
        </TogetherPrimaryLink>
      ) : null}

      <section className="flex flex-col gap-(--space-3)">
        <SectionHeader
          title={t("manageTitle")}
          description={t("manageDescription")}
        />
        <TogetherNavGroup>
          <TogetherNavRow
            href={TOGETHER_PATH.INVITATIONS}
            appearance={TogetherNavAppearance.GROUPED}
            icon={UTILITY_ICONS.notification}
            title={t("invitationsLink")}
            description={t("manageInvitationsDescription")}
            badge={pendingCount > 0 ? String(pendingCount) : undefined}
            testId="together-invitations-link"
          />
          <TogetherNavRow
            href={TOGETHER_PATH.POLICIES}
            appearance={TogetherNavAppearance.GROUPED}
            icon={FINANCE_ICONS.wallet}
            title={t("policiesLink")}
            description={t("managePoliciesDescription")}
            testId="together-policies-link"
          />
          <TogetherNavRow
            href={TOGETHER_PATH.PREFERENCES}
            appearance={TogetherNavAppearance.GROUPED}
            icon={UTILITY_ICONS.calendar}
            title={t("preferencesLink")}
            description={t("managePreferencesDescription")}
            testId="together-preferences-link"
          />
          <TogetherNavRow
            href={TOGETHER_PATH.SETTINGS}
            appearance={TogetherNavAppearance.GROUPED}
            icon={UTILITY_ICONS.settings}
            title={t("settingsLink")}
            description={t("manageSettingsDescription")}
            testId="together-settings-link"
          />
        </TogetherNavGroup>
      </section>
    </ProductPage>
  );
}

function TogetherHeroAvatars({ members }: { members: HouseholdMemberRow[] }) {
  if (members.length === 0) {
    return (
      <IconContainer tone="primary" size="md">
        <AppIcon icon={NAVIGATION_ICONS.together} size="lg" emphasized />
      </IconContainer>
    );
  }

  const visibleMembers = members.slice(0, TOGETHER_HERO_AVATAR_LIMIT);

  return (
    <div className="flex shrink-0">
      {visibleMembers.map((member, index) => (
        <span
          key={member.id}
          className={cn(
            "inline-flex rounded-[var(--radius-control)] ring-2 ring-white/20",
            index > 0 && "-ml-2",
          )}
        >
          <IconContainer
            tone={member.role === HOUSEHOLD_ROLE.ADMIN ? "primary" : "neutral"}
            size="sm"
            className="bg-white/15 text-hero-fg"
          >
            <span className="text-xs font-semibold">
              {memberInitials(member.email, member.displayName)}
            </span>
          </IconContainer>
        </span>
      ))}
    </div>
  );
}
