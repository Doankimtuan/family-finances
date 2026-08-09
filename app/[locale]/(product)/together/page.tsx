import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import { listHouseholdMembers } from "@/modules/tenancy/application/list-household-members";
import {
  HOUSEHOLD_MEMBER_LIMIT,
  HOUSEHOLD_ROLE,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page as ProductPage } from "@/shared/patterns/page";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";

type Props = { params: Promise<{ locale: string }> };

const secondaryLinkClassName =
  "inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

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
          title={t("title")}
          subtitle={
            result.household
              ? `${t("householdLabel")}: ${result.household.name}`
              : undefined
          }
        />
      }
    >
      <section className="flex flex-col gap-(--space-3)">
        <SectionHeader
          title={t("overviewTitle")}
          description={t("overviewDescription")}
        />
        <Card className="gap-(--space-2) p-(--space-4)">
          <Text size="sm" tone="secondary">
            {t("memberCountLabel")}
          </Text>
          <Text className="text-2xl font-semibold tabular-nums text-text-primary">
            {result.members.length}
          </Text>
          <Text size="sm" tone="secondary">
            {membership.role === HOUSEHOLD_ROLE.ADMIN
              ? t("roleAdmin")
              : t("rolePartner")}
          </Text>
        </Card>
      </section>

      {canInvite ? (
        <Link
          href={TOGETHER_PATH.INVITATIONS_NEW}
          data-testid="together-invite-cta"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-(--space-4) text-sm font-medium text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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
