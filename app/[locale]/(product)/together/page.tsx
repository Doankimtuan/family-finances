import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import { listHouseholdMembers } from "@/modules/tenancy/application/list-household-members";
import {
  HOUSEHOLD_MEMBER_LIMIT,
  HOUSEHOLD_ROLE,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import { HeaderPill, TopAppBar } from "@/shared/patterns/top-app-bar";
import { NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { Page as ProductPage } from "@/shared/patterns/page";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { StatusBadge } from "@/shared/ui/status-badge";

type Props = { params: Promise<{ locale: string }> };

const secondaryLinkClassName =
  "inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-card)] border border-border-subtle/60 bg-surface-muted/45 px-(--space-4) transition-[background-color,border-color,transform] duration-(--duration-fast) hover:border-border-default hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

export default async function Page({ params }: Props) {
  const { locale: localeParam } = await params;
  const { membership } = await requireTogetherMembership({
    localeParam,
    nextPath: TOGETHER_PATH.ROOT,
  });
  const [t, result] = await Promise.all([
    getTranslations("together"),
    listHouseholdMembers(),
  ]);

  const canInvite =
    result.household !== null && result.members.length < HOUSEHOLD_MEMBER_LIMIT;

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
          status={
            <HeaderPill tone="info">
              {membership.role === HOUSEHOLD_ROLE.ADMIN
                ? t("roleAdmin")
                : t("rolePartner")}
            </HeaderPill>
          }
          meta={
            result.household ? (
              <>
                {t("header.meta", { count: result.members.length })} ·{" "}
                {result.household.name}
              </>
            ) : (
              t("header.meta", { count: result.members.length })
            )
          }
        />
      }
    >
      <section className="flex flex-col gap-(--space-3)">
        <SectionHeader
          title={t("overviewTitle")}
          description={t("overviewDescription")}
        />
        <Card tone="soft" className="gap-(--space-3) p-(--space-4)">
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
                <Text size="sm" tone="secondary">
                  {t("memberCountLabel")}
                </Text>
                <Text className="text-3xl font-semibold tabular-nums tracking-tight text-text-primary">
                  {result.members.length}
                </Text>
              </div>
            </div>
            <StatusBadge tone="info">
              {membership.role === HOUSEHOLD_ROLE.ADMIN
                ? t("roleAdmin")
                : t("rolePartner")}
            </StatusBadge>
          </div>
        </Card>
      </section>

      {canInvite ? (
        <Link
          href={TOGETHER_PATH.INVITATIONS_NEW}
          data-testid="together-invite-cta"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-card)] bg-accent px-(--space-4) text-sm font-semibold text-accent-fg shadow-[var(--elevation-1)] transition-[background-color,transform,box-shadow] duration-(--duration-fast) hover:-translate-y-px hover:shadow-[var(--elevation-2)] active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("inviteCta")}
        </Link>
      ) : null}

      <div className="flex flex-col gap-(--space-2)">
        <Link
          href={TOGETHER_PATH.MEMBERS}
          data-testid="together-members-link"
          className={secondaryLinkClassName}
        >
          {t("membersLink")}
        </Link>
        <Link
          href={TOGETHER_PATH.INVITATIONS}
          className={secondaryLinkClassName}
        >
          {t("invitationsLink")}
        </Link>
        <Link href={TOGETHER_PATH.POLICIES} className={secondaryLinkClassName}>
          {t("policiesLink")}
        </Link>
        <Link
          href={TOGETHER_PATH.PREFERENCES}
          className={secondaryLinkClassName}
        >
          {t("preferencesLink")}
        </Link>
        <Link href={TOGETHER_PATH.SETTINGS} className={secondaryLinkClassName}>
          {t("settingsLink")}
        </Link>
      </div>
    </ProductPage>
  );
}
