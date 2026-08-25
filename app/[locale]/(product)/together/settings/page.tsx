import { getTranslations } from "next-intl/server";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import {
  HOUSEHOLD_ROLE,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { SectionHeader } from "@/shared/patterns/section-header";
import { TogetherNavRow } from "@/shared/patterns/together-management";
import { TogetherPreferences } from "@/shared/patterns/together-preferences";
import { Card } from "@/shared/patterns/card";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { Text } from "@/shared/ui/text";
import { NAVIGATION_ICONS, UTILITY_ICONS } from "@/shared/ui/icon-registry";

type Props = { params: Promise<{ locale: string }> };

export default async function SettingsPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const { user, membership } = await requireTogetherMembership({
    localeParam,
    nextPath: TOGETHER_PATH.SETTINGS,
  });
  const t = await getTranslations("settings");
  const role =
    membership.role === HOUSEHOLD_ROLE.ADMIN
      ? t("roleAdmin")
      : t("rolePartner");

  return (
    <Page
      testId="together-settings-page"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={TOGETHER_PATH.ROOT}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      <section className="flex flex-col gap-(--space-3)">
        <SectionHeader
          title={t("profileTitle")}
          description={t("profileDescription")}
        />
        <Card tone="elevated" className="overflow-hidden p-0">
          <div className="flex items-center gap-(--space-3) p-(--space-4)">
            <IconContainer tone="primary" size="md">
              <AppIcon icon={NAVIGATION_ICONS.together} size="md" emphasized />
            </IconContainer>
            <div className="min-w-0 flex-1">
              <Text size="xs" tone="secondary">
                {t("emailLabel")}
              </Text>
              <Text
                size="sm"
                className="mt-(--space-1) break-words font-semibold text-text-primary"
              >
                {user.email ?? t("emailMissing")}
              </Text>
              <Text
                size="xs"
                tone="secondary"
                className="mt-(--space-1) text-pretty"
              >
                {t("roleNote", { role })}
              </Text>
            </div>
          </div>
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
          title={t("accountTitle")}
          description={t("accountDescription")}
        />
        <TogetherNavRow
          href={TOGETHER_PATH.SETTINGS_ACCOUNT}
          icon={UTILITY_ICONS.settings}

          title={t("accountSettingsLink")}
          description={t("accountSettingsDescription")}
          testId="together-settings-account"
        />
      </section>
    </Page>
  );
}
