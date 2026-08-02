import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import {
  HOUSEHOLD_ROLE,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { SectionHeader } from "@/shared/patterns/section-header";
import { TogetherPreferences } from "@/shared/patterns/together-preferences";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { AccountLifecycleCard } from "../account-lifecycle-card";

type Props = { params: Promise<{ locale: string }> };

export default async function PreferencesPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const { user, membership } = await requireTogetherMembership({
    localeParam,
    nextPath: TOGETHER_PATH.PREFERENCES,
  });

  const t = await getTranslations("together.preferences");

  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="together-preferences-page"
    >
      <TopAppBar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <section className="flex flex-col gap-(--space-3)">
          <SectionHeader
            title={t("profileTitle")}
            description={t("profileDescription")}
          />
          <Card className="gap-0 p-(--space-4)">
            <Text size="sm" tone="secondary">
              {t("emailLabel")}
            </Text>
            <Text size="sm" className="font-medium text-text-primary">
              {user.email ?? t("emailMissing")}
            </Text>
            <Text size="sm" tone="secondary" className="mt-(--space-2)">
              {t("roleNote", {
                role:
                  membership.role === HOUSEHOLD_ROLE.ADMIN
                    ? t("roleAdmin")
                    : t("rolePartner"),
              })}
            </Text>
          </Card>
        </section>

        <section className="flex flex-col gap-(--space-3)">
          <SectionHeader
            title={t("appTitle")}
            description={t("appDescription")}
          />
          <TogetherPreferences />
        </section>

        <section className="flex flex-col gap-(--space-3)">
          <SectionHeader
            title={t("securityTitle")}
            description={t("securityDescription")}
          />
          <AccountLifecycleCard />
        </section>

        <Link
          href={TOGETHER_PATH.ROOT}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
