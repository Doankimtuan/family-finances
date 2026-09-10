import { getTranslations } from "next-intl/server";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import { getHouseholdPreferences } from "@/modules/tenancy/application/get-household-preferences";
import {
  HOUSEHOLD_ROLE,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { SectionHeader } from "@/shared/patterns/section-header";
import {
  TogetherNavAppearance,
  TogetherNavGroup,
  TogetherNavRow,
} from "@/shared/patterns/together-management";
import { TogetherPreferences } from "@/shared/patterns/together-preferences";
import { Card } from "@/shared/patterns/card";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { NAVIGATION_ICONS, UTILITY_ICONS } from "@/shared/ui/icon-registry";
import { householdLocaleLabelKey } from "../together-presentations";

type Props = { params: Promise<{ locale: string }> };

export default async function SettingsPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const { user, membership } = await requireTogetherMembership({
    localeParam,
    nextPath: TOGETHER_PATH.SETTINGS,
  });
  const [t, tPreferences, preferences] = await Promise.all([
    getTranslations("settings"),
    getTranslations("together.preferences"),
    getHouseholdPreferences(),
  ]);
  const role =
    membership.role === HOUSEHOLD_ROLE.ADMIN
      ? t("roleAdmin")
      : t("rolePartner");
  const householdLocaleKey = preferences
    ? householdLocaleLabelKey(preferences.locale)
    : null;
  const householdLocaleLabel = householdLocaleKey
    ? tPreferences(householdLocaleKey)
    : null;

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
          <div className="flex min-h-14 items-center gap-(--space-3) p-(--space-4)">
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
            <StatusBadge tone="info" className="shrink-0 whitespace-nowrap">
              {role}
            </StatusBadge>
          </div>
        </Card>
      </section>

      <section className="flex flex-col gap-(--space-3)">
        <SectionHeader
          title={t("householdTitle")}
          description={t("householdDescription")}
        />
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          <div className="divide-y divide-divider">
            {preferences ? (
              <dl className="divide-y divide-divider">
                <HouseholdPreferenceFact
                  label={tPreferences("localeLabel")}
                  value={householdLocaleLabel ?? preferences.locale}
                />
                <HouseholdPreferenceFact
                  label={tPreferences("timezoneLabel")}
                  value={preferences.timezone}
                />
                <HouseholdPreferenceFact
                  label={tPreferences("currencyLabel")}
                  value={preferences.baseCurrency}
                />
              </dl>
            ) : null}
            <TogetherNavRow
              href={TOGETHER_PATH.PREFERENCES}
              appearance={TogetherNavAppearance.GROUPED}
              icon={UTILITY_ICONS.calendar}
              title={tPreferences("title")}
              description={t("householdRowDescription")}
              testId="together-preferences-link"
            />
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
        <TogetherNavGroup>
          <TogetherNavRow
            href={TOGETHER_PATH.SETTINGS_ACCOUNT}
            appearance={TogetherNavAppearance.GROUPED}
            icon={UTILITY_ICONS.settings}
            title={t("accountSettingsLink")}
            description={t("accountSettingsDescription")}
            testId="together-settings-account"
          />
        </TogetherNavGroup>
      </section>
    </Page>
  );
}

function HouseholdPreferenceFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-(--space-3) px-(--space-4) py-(--space-3)">
      <dt className="min-w-0">
        <Text size="sm" tone="secondary">
          {label}
        </Text>
      </dt>
      <dd className="min-w-0 text-end">
        <Text size="sm" className="font-medium text-pretty text-text-primary">
          {value}
        </Text>
      </dd>
    </div>
  );
}
