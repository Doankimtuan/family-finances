import { getLocale, getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import { homeGreetingPeriod } from "@/modules/home/application/home-constants";
import { HomeDashboardSkeleton } from "./home-dashboard-skeleton";

/**
 * Home loading skeleton — mirrors the loaded page composition (compact
 * header, financial hero, net strip, cash-flow story, Inbox, Plan) so the
 * loading → loaded transition does not recompose the layout.
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
          eyebrow={t("header.eyebrow")}
          title={t(`header.greeting.${homeGreetingPeriod()}`)}
          subtitle={t("header.dashboardSupporting")}
          icon={NAVIGATION_ICONS.home}
          meta={t("header.meta.unavailable")}
        />
      }
      contentClassName="gap-(--space-5)"
    >
      <HomeDashboardSkeleton />
    </Page>
  );
}
