import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import { getHouseholdPreferences } from "@/modules/tenancy/application/get-household-preferences";
import { TOGETHER_PATH } from "@/modules/tenancy/application/tenancy-constants";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { HouseholdPreferencesForm } from "./household-preferences-form";

type Props = { params: Promise<{ locale: string }> };

export default async function PreferencesPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const { locale } = await requireTogetherMembership({
    localeParam,
    nextPath: TOGETHER_PATH.PREFERENCES,
  });
  const [preferences, t] = await Promise.all([
    getHouseholdPreferences(),
    getTranslations("together.preferences"),
  ]);

  if (!preferences) {
    return redirect({ href: TOGETHER_PATH.ROOT, locale });
  }

  return (
    <Page
      testId="together-preferences-page"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={TOGETHER_PATH.ROOT}
          title={t("title")}
          subtitle={preferences.householdName}
        />
      }
    >
      <HouseholdPreferencesForm initial={preferences} />
    </Page>
  );
}
