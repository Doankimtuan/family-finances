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
} from "@/shared/patterns";
import { MotionReveal } from "@/shared/motion";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import {
  ACTION_ICONS,
  FINANCE_ICONS,
  NAVIGATION_ICONS,
  UTILITY_ICONS,
} from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";
import { TogetherInvitationPreview } from "./together-invitation-preview";
import { InvitationsPanel } from "./invitations/invitations-panel";
import { TogetherOverviewHeader } from "./together-overview-header";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { TogetherMemberPreview } from "./together-member-preview";
import { memberInitials } from "./together-member-identity";
import { isHouseholdAdmin } from "./together-presentations";

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

  const isAdmin = isHouseholdAdmin(membership.role);
  const canInvite =
    isAdmin &&
    result.household !== null &&
    result.members.length < HOUSEHOLD_MEMBER_LIMIT;
  const isSoloAdmin = isAdmin && result.members.length === 1;
  const roleLabel = isAdmin ? t("roleAdmin") : t("rolePartner");
  const householdName = result.household?.name ?? t("householdLabel");
  const pendingCount = pendingInvitations.length;
  const unnamedFallback = t("unnamedMember");

  return (
    <ProductPage
      testId="together-overview-page"
      topBar={
        <TogetherOverviewHeader
          eyebrow={t("header.eyebrow")}
          title={t("header.headline")}
          supporting={t("header.supporting")}
          roleLabel={roleLabel}
          settingsLabel={t("settingsLink")}
        />
      }
      contentClassName="pt-0"
    >
      <MotionReveal>
        <Card tone="elevated" className="gap-(--space-4) p-(--space-4)">
          <div className="flex items-start gap-(--space-3)">
            <TogetherHeroAvatars members={result.members} />
            <div className="min-w-0 flex-1">
              <Text className="break-words text-base font-semibold tracking-tight text-pretty text-text-primary">
                {householdName}
              </Text>
              <Text
                size="xs"
                className="mt-(--space-1) text-text-secondary text-pretty"
                data-testid="together-member-count"
              >
                {t("header.meta", { count: result.members.length })}
              </Text>
            </div>
            <StatusBadge tone={StatusBadgeTone.POSITIVE} className="shrink-0">
              {t("householdActive")}
            </StatusBadge>
          </div>
          <div className="flex items-start gap-(--space-2) border-t border-divider pt-(--space-3)">
            <AppIcon
              icon={UTILITY_ICONS.shield}
              size="sm"
              className="shrink-0 text-primary"
            />
            <Text
              size="xs"
              tone="secondary"
              className="text-pretty leading-relaxed"
            >
              <span className="font-medium text-text-primary">
                {t("roleContext", { role: roleLabel })}:{" "}
              </span>
              {isAdmin
                ? t("overviewAdminResponsibility")
                : t("overviewPartnerResponsibility")}
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
          description={
            <Text size="xs" tone="secondary">
              {t("membersDescription")}
            </Text>
          }
          action={
            <Link
              href={TOGETHER_PATH.MEMBERS}
              data-testid="together-members-link"
            >
              {t("membersLink")}
              <AppIcon
                icon={ACTION_ICONS.forward}
                size="xs"
                className="ml-(--space-1)"
              />
            </Link>
          }
        />
        {result.members.length > 0 ? (
          <TogetherMemberPreview
            members={result.members}
            youLabel={t("you")}
            unnamedFallback={unnamedFallback}
            roleAdminLabel={t("roleAdmin")}
            rolePartnerLabel={t("rolePartner")}
            roleAdminHint={t("members.roleAdminHint")}
            rolePartnerHint={t("members.rolePartnerHint")}
            activeLabel={t("members.active")}
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
          tonal
        >
          <AppIcon icon={ACTION_ICONS.add} size="sm" />
          {t("inviteCta")}
        </TogetherPrimaryLink>
      ) : null}

      {pendingCount > 0 ? (
        <section className="flex flex-col gap-(--space-3)">
          <SectionHeader
            title={t("invitedTitle")}
            action={
              <Link href={TOGETHER_PATH.INVITATIONS}>
                {t("viewInvitationsWithCount", { count: pendingCount })}
              </Link>
            }
          />
          {isAdmin ? (
            <InvitationsPanel
              initialInvitations={pendingInvitations}
              showHeading={false}
            />
          ) : (
            <TogetherInvitationPreview
              invitations={pendingInvitations}
              locale={localeParam}
              pendingLabel={t("invitations.pendingTitle")}
              expiresLabel={(date) => t("invitations.expires", { date })}
            />
          )}
        </section>
      ) : null}

      <section className="flex flex-col gap-(--space-3)">
        <SectionHeader title={t("collaborationTitle")} />
        <TogetherNavGroup>
          {pendingCount === 0 ? (
            <TogetherNavRow
              href={TOGETHER_PATH.INVITATIONS}
              appearance={TogetherNavAppearance.GROUPED}
              icon={UTILITY_ICONS.notification}
              title={t("invitationsLink")}
              description={t("manageInvitationsDescription")}
              testId="together-invitations-link"
            />
          ) : null}
          <TogetherNavRow
            href={TOGETHER_PATH.POLICIES}
            appearance={TogetherNavAppearance.GROUPED}
            icon={FINANCE_ICONS.ledger}
            title={t("policiesLink")}
            description={t("managePoliciesDescription")}
            testId="together-policies-link"
          />
        </TogetherNavGroup>
      </section>
      <TogetherNavRow
        href={TOGETHER_PATH.SETTINGS}
        icon={UTILITY_ICONS.settings}
        iconTone={IconContainerTone.NEUTRAL}
        title={t("overviewSettingsTitle")}
        description={t("overviewSettingsDescription")}
        testId="together-settings-link"
      />
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
    <div className="flex shrink-0" aria-hidden>
      {visibleMembers.map((member, index) => (
        <span
          key={member.id}
          className={cn(
            "inline-flex rounded-full ring-2 ring-surface",
            index > 0 && "-ml-(--space-2)",
          )}
        >
          <Avatar className="size-9">
            <AvatarFallback
              className={cn(
                "size-full rounded-full text-xs font-semibold",
                isHouseholdAdmin(member.role)
                  ? "bg-info/10 text-info"
                  : "bg-primary-soft text-primary",
              )}
            >
              {memberInitials(member.email, member.displayName)}
            </AvatarFallback>
          </Avatar>
        </span>
      ))}
    </div>
  );
}
