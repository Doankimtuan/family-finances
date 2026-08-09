import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
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
        <TopAppBar title={t("title")} subtitle={preferences.householdName} />
      }
    >
      <HouseholdPreferencesForm initial={preferences} />
      <Link
        href={TOGETHER_PATH.ROOT}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {t("back")}
      </Link>
    </Page>
  );
}
