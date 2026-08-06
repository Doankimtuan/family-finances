import { getLocale, getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { BrandMark } from "@/shared/patterns/brand-mark";
import { Heading } from "@/shared/ui/heading";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  HOME_TEST_ID,
  HOME_TRANSLATION_NAMESPACE,
} from "@/modules/home/application/home-constants";

/**
 * Home loading skeleton — reserved shapes that match the final layout.
 * Reduces motion automatically via the `motion-reduce` utilities.
 */
export default async function HomeLoading() {
  const locale = await getLocale();
  const t = await getTranslations({
    locale,
    namespace: HOME_TRANSLATION_NAMESPACE,
  });

  return (
    <Page
      testId={HOME_TEST_ID.LOADING}
      topBar={
        <TopAppBar
          title={
            <div className="flex min-w-0 items-center gap-(--space-2)">
              <BrandMark variant="mark" size="sm" className="shrink-0" />
              <Heading level={1} className="truncate text-lg">
                {t("title")}
              </Heading>
            </div>
          }
        />
      }
    >
      <Section variant="emphasized" contentClassName="gap-(--space-4)">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-12 w-2/3 rounded" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </Section>

      <Section variant="surface" contentClassName="gap-(--space-4)">
        <Skeleton className="h-4 w-24 rounded" />
        <div className="flex items-end justify-between gap-(--space-3)">
          <Skeleton className="h-8 w-32 rounded" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </Section>

      <Section variant="surface" contentClassName="gap-(--space-4)">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-8 w-full rounded" />
      </Section>

      <Section
        variant="surface"
        className="bg-surface-elevated"
        contentClassName="gap-(--space-3)"
      >
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-20 w-full rounded" />
      </Section>
    </Page>
  );
}
