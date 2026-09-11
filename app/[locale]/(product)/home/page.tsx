import { Suspense } from "react";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { setLocale } from "@/i18n/set-locale";
import { getHomeReadiness } from "@/modules/home/application";
import {
  HOME_TEST_ID,
  HomeStatusLaneKind,
} from "@/modules/home/application/home-constants";
import { Page } from "@/shared/patterns/page";
import { HomeStatusLane } from "./home-status-lane";
import {
  HomeContent,
  HomeStreamingFallback,
  HomeTopBar,
  HomeTopBarFallback,
  type HomeSearchParams,
} from "./home-streaming-sections";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: HomeSearchParams;
};

/**
 * Home is the household command center: current position, attention,
 * intention, then period movement.
 */
export default async function HomePage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const readiness = getHomeReadiness();

  return (
    <Page
      testId={HOME_TEST_ID.DASHBOARD}
      topBar={
        <Suspense fallback={<HomeTopBarFallback />}>
          <HomeTopBar readiness={readiness} />
        </Suspense>
      }
      contentClassName="gap-(--space-5)"
    >
      <HomeStatusLane kind={HomeStatusLaneKind.OFFLINE} />
      <Suspense fallback={<HomeStreamingFallback />}>
        <HomeContent
          locale={locale}
          readiness={readiness}
          searchParams={searchParams}
        />
      </Suspense>
    </Page>
  );
}
