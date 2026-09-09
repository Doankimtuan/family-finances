import { getLocale, getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { FloatingAction } from "@/shared/patterns/floating-action";
import { Skeleton } from "@/shared/ui/skeleton";
import { NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { MoneyCaptureAction } from "./money-capture-action";

function HeroSkeleton() {
  return (
    <div className="flex flex-col gap-(--space-3)">
      <Card tone="hero" className="gap-0 p-(--space-4)">
        <div className="flex items-center justify-between gap-(--space-3)">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="size-11 rounded-(--radius-control)" />
        </div>
        <Skeleton className="mt-(--space-2) h-9 w-52" />
        <div className="mt-(--space-4) flex items-center justify-between gap-(--space-3) border-t border-white/15 pt-(--space-3)">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </Card>
      <Card tone="elevated" className="gap-0 p-(--space-4)">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-(--space-3) h-2 w-full rounded-full" />
        <div className="mt-(--space-3) flex flex-col gap-y-(--space-2)">
          {[0, 1, 2].map((cell) => (
            <div
              key={cell}
              className="flex items-center justify-between gap-(--space-2)"
            >
              <div className="flex items-center gap-(--space-2)">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-col gap-(--space-1)">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ModuleCardSkeleton() {
  return (
    <section className="flex flex-col gap-(--space-3)">
      <div className="flex flex-col gap-(--space-1)">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>
      <Card tone="elevated" className="gap-0 p-0">
        <div className="flex flex-col divide-y divide-border-subtle/65 py-(--space-1)">
          {[0, 1].map((row) => (
            <div
              key={row}
              className="flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-2)"
            >
              <Skeleton className="size-8 rounded-full" />
              <div className="flex flex-1 flex-col gap-(--space-1)">
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

function AccountsSkeleton() {
  return (
    <section className="flex flex-col gap-(--space-4)">
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="flex flex-col gap-(--space-1)">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-11 w-24 rounded-(--radius-control)" />
      </div>
      <Card tone="elevated" className="gap-0 p-0">
        <div className="flex flex-col divide-y divide-border-subtle/65 py-(--space-1)">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-2)"
            >
              <Skeleton className="size-8 rounded-full" />
              <div className="flex flex-1 flex-col gap-(--space-1)">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

/** Loading shell mirrors the Money hub: accessible-money hero → allocation strip → accounts → module groups. */
export default async function MoneyLoading() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "money" });

  return (
    <Page
      testId="money-hub-loading"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="primary"
          title={t("title")}
          subtitle={<Skeleton className="h-4 w-56" />}
          icon={NAVIGATION_ICONS.money}
          meta={<Skeleton className="h-4 w-28" />}
        />
      }
    >
      <HeroSkeleton />
      <AccountsSkeleton />
      <ModuleCardSkeleton />
      <ModuleCardSkeleton />
      <FloatingAction>
        <MoneyCaptureAction />
      </FloatingAction>
    </Page>
  );
}
