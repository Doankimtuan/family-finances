import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import { listHouseholdMembers } from "@/modules/tenancy/application/list-household-members";
import { listPendingInvitations } from "@/modules/tenancy/application/list-pending-invitations";
import {
  HOUSEHOLD_MEMBER_LIMIT,
  HOUSEHOLD_ROLE,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import {
  Card,
  Page as ProductPage,
  SectionHeader,
  TogetherNavRow,
  TogetherStatusStrip,
  TopAppBar,
} from "@/shared/patterns";
import { HeaderPill } from "@/shared/patterns/top-app-bar";
import { MotionReveal } from "@/shared/motion";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import {
  FINANCE_ICONS,
  NAVIGATION_ICONS,
  UTILITY_ICONS,
} from "@/shared/ui/icon-registry";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";

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
  const roleLabel =
    membership.role === HOUSEHOLD_ROLE.ADMIN
      ? t("roleAdmin")
      : t("rolePartner");

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
          meta={
            result.household
              ? `${t("header.meta", { count: result.members.length })} · ${result.household.name}`
              : t("header.meta", { count: result.members.length })
          }
        />
      }
    >
      <section className="flex flex-col gap-(--space-3)">
        <SectionHeader
          title={t("overviewTitle")}
          description={t("overviewDescription")}
        />
        <MotionReveal>
          <Card tone="hero" className="gap-(--space-4) p-(--space-4)">
            <div className="flex items-start justify-between gap-(--space-3)">
              <div className="flex min-w-0 items-center gap-(--space-3)">
                <IconContainer tone="primary" size="md">
                  <AppIcon
                    icon={NAVIGATION_ICONS.together}
                    size="lg"
                    emphasized
                  />
                </IconContainer>
                <div className="min-w-0">
                  <Text size="xs" className="text-hero-muted">
                    {t("householdLabel")}
                  </Text>
                  <Text className="truncate text-xl font-semibold tracking-tight text-hero-fg">
                    {result.household?.name ?? t("householdLabel")}
                  </Text>
                </div>
              </div>
              <StatusBadge
                tone="info"
                className="bg-white/15 text-hero-fg ring-1 ring-white/20"
              >
                {roleLabel}
              </StatusBadge>
            </div>
            <div className="flex items-end justify-between gap-(--space-3) border-t border-white/15 pt-(--space-3)">
              <div>
                <Text size="xs" className="text-hero-muted">
                  {t("memberCountLabel")}
                </Text>
                <Text className="text-3xl font-semibold tabular-nums tracking-tight text-hero-fg">
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
      </section>

      {isSoloAdmin ? (
        <TogetherStatusStrip>
          <Text size="sm" className="font-semibold text-text-primary">
            {t("householdClosureUnavailableTitle")}
          </Text>
          <Text size="sm" tone="secondary" className="mt-0.5 text-pretty">
            {t("householdClosureUnavailableBody")}
          </Text>
        </TogetherStatusStrip>
      ) : null}

      {canInvite ? (
        <Link
          href={TOGETHER_PATH.INVITATIONS_NEW}
          data-testid="together-invite-cta"
          className="inline-flex min-h-12 w-full items-center justify-center gap-(--space-2) rounded-[var(--radius-control)] bg-accent px-(--space-4) text-sm font-semibold text-accent-fg shadow-[var(--elevation-1)] transition-[background-color,transform,box-shadow] duration-(--duration-fast) hover:-translate-y-px hover:shadow-[var(--elevation-2)] active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <AppIcon icon={UTILITY_ICONS.notification} size="sm" />
          {t("inviteCta")}
        </Link>
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
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          <div className="flex items-center gap-(--space-3) p-(--space-3)">
            <IconContainer tone="primary" size="sm">
              <AppIcon icon={NAVIGATION_ICONS.together} size="sm" />
            </IconContainer>
            <div className="min-w-0 flex-1">
              <Text size="sm" className="font-semibold text-text-primary">
                {t("memberCountLabel")}
              </Text>
              <Text size="xs" tone="secondary">
                {t("header.meta", { count: result.members.length })}
              </Text>
            </div>
            <Text className="text-xl font-semibold tabular-nums tracking-tight text-text-primary">
              {result.members.length}
            </Text>
          </div>
        </Card>
      </section>

      <MotionReveal>
        <section className="flex flex-col gap-(--space-3)">
          <SectionHeader
            title={t("manageTitle")}
            description={t("manageDescription")}
          />
          <div className="flex flex-col gap-(--space-2)">
            <TogetherNavRow
              href={TOGETHER_PATH.INVITATIONS}
              icon={UTILITY_ICONS.notification}
              title={t("invitationsLink")}
              description={t("manageInvitationsDescription")}
              meta={
                pendingInvitations.length > 0
                  ? String(pendingInvitations.length)
                  : undefined
              }
              testId="together-invitations-link"
            />
            <TogetherNavRow
              href={TOGETHER_PATH.POLICIES}
              icon={FINANCE_ICONS.wallet}
              title={t("policiesLink")}
              description={t("managePoliciesDescription")}
              testId="together-policies-link"
            />
            <TogetherNavRow
              href={TOGETHER_PATH.SETTINGS}
              icon={NAVIGATION_ICONS.together}
              title={t("settingsLink")}
              description={t("manageSettingsDescription")}
              testId="together-settings-link"
            />
          </div>
        </section>
      </MotionReveal>
    </ProductPage>
  );
}
