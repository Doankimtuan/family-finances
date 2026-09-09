import { getLocale, getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import { homeGreetingPeriod } from "@/modules/home/application/home-constants";
import { HomeDashboardSkeleton } from "./home-dashboard-skeleton";

/**
 * Home loading skeleton — mirrors the loaded command-center composition
 * (header, hero, Inbox, Plan, period story) so loading does not recompose.
 */
export default async function HomeLoading() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "home" });
  return (
    <Page
      testId={HOME_TEST_ID.LOADING}
      topBar={
        <TopAppBar
          variant="contextual"
          showBrandMark
          eyebrow={t("header.householdContext")}
          title={t(`header.greeting.${homeGreetingPeriod()}`)}
          subtitle={t("header.dashboardSupporting")}
          meta={t("header.meta.unavailable")}
        />
      }
      contentClassName="gap-(--space-5)"
    >
      <HomeDashboardSkeleton />
    </Page>
  );
}
