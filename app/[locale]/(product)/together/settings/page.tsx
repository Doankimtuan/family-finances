import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import {
  HOUSEHOLD_ROLE,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { SectionHeader } from "@/shared/patterns/section-header";
import { TogetherPreferences } from "@/shared/patterns/together-preferences";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";

type Props = { params: Promise<{ locale: string }> };

const linkClassName =
  "inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

export default async function SettingsPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const { user, membership } = await requireTogetherMembership({
    localeParam,
    nextPath: TOGETHER_PATH.SETTINGS,
  });
  const t = await getTranslations("settings");

  return (
    <Page
      testId="together-settings-page"
      topBar={<TopAppBar title={t("title")} subtitle={t("subtitle")} />}
    >
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

      <div className="flex flex-col gap-(--space-2)">
        <Link href={TOGETHER_PATH.PREFERENCES} className={linkClassName}>
          {t("householdPreferencesLink")}
        </Link>
        <Link href={TOGETHER_PATH.SETTINGS_ACCOUNT} className={linkClassName}>
          {t("accountSettingsLink")}
        </Link>
        <Link href={TOGETHER_PATH.ROOT} className={linkClassName}>
          {t("back")}
        </Link>
      </div>
    </Page>
  );
}
