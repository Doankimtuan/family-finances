import { getLocale, getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Skeleton } from "@/shared/ui/skeleton";
import { orderedWeekdayKeys } from "@/shared/i18n/week-start";
import { CalendarMonthFrame } from "./calendar-month-frame";
import { CALENDAR_GRID_CELL_COUNT } from "./calendar-navigation";

export default async function PlanCalendarLoading() {
  const locale = await getLocale();
  const t = await getTranslations("plan.calendar");
  const weekdayLabels = orderedWeekdayKeys(locale).map((key) =>
    t(`weekdays.${key}`),
  );

  return (
    <Page
      testId="plan-calendar-loading"
      topBar={
        <TopAppBar
          variant={TopAppBarVariant.DETAIL}
          title={t("title")}
          subtitle={t("subtitle")}
          backHref={APP_PATH.PLAN}
          backLabel={t("backToPlan")}
        />
      }
    >
      <div
        className="flex flex-col gap-(--space-5)"
        data-testid="plan-calendar"
      >
        <Skeleton className="h-4 w-56" />
        <CalendarMonthFrame
          monthHeading={<Skeleton className="mx-auto h-6 w-40" />}
          weekdayLabels={weekdayLabels}
          navLabel={t("monthNavLabel")}
          gridLabel={t("gridLabel")}
        >
          {Array.from({ length: CALENDAR_GRID_CELL_COUNT }, (_, index) => (
            <Skeleton
              key={`calendar-cell-${index}`}
              className="min-h-11 w-full rounded-(--radius-control)"
            />
          ))}
        </CalendarMonthFrame>
        <div className="flex flex-col gap-(--space-3)">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-16 w-full rounded-(--radius-card)" />
        </div>
      </div>
    </Page>
  );
}
