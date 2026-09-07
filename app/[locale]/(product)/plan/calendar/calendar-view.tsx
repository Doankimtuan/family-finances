"use client";

import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  APP_PATH,
  inboxItemPath,
  moneyAccountPath,
  moneyDebtPath,
  moneyLoanPath,
  planCalendarPath,
  planRecurringPath,
} from "@/modules/tenancy/application/app-path";
import {
  CalendarEventSource,
  type CalendarEvent,
} from "@/modules/plan/application/client";
import { Text } from "@/shared/ui/text";
import { Card } from "@/shared/patterns/card";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AlertVariant } from "@/shared/ui/alert";
import { SectionHeader } from "@/shared/patterns/section-header";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { formatDate } from "@/shared/i18n/formatters";
import {
  orderedWeekdayKeys,
  weekStartDayForLocale,
} from "@/shared/i18n/week-start";
import {
  PLAN_ACCENT_LINK_CLASS,
  PLAN_SURFACE_LINK_CLASS,
} from "../plan-chrome";
import { CalendarMonthFrame } from "./calendar-month-frame";
import {
  calendarMonthCells,
  daysInUtcMonth,
  parseAnchorMonth,
  shiftPeriodMonth,
} from "./calendar-navigation";

type ReadyProps = {
  isUnavailable?: false;
  currency: string;
  eventsByDate: Record<string, CalendarEvent[]>;
  deficitDates: string[];
  payoffMilestoneDates: string[];
  startingBalance: number;
  payoffInboxItemByPlanId: Record<string, string>;
};

type UnavailableProps = {
  isUnavailable: true;
};

type Props = {
  anchorMonth: string;
} & (ReadyProps | UnavailableProps);

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function eventHref(event: CalendarEvent): string {
  switch (event.source) {
    case CalendarEventSource.RECURRING:
      return planRecurringPath(event.sourceId);
    case CalendarEventSource.CARD_DUE:
      return moneyAccountPath(event.sourceId);
    case CalendarEventSource.LOAN:
    case CalendarEventSource.PAYOFF_MILESTONE:
      return moneyLoanPath(event.sourceId);
    case CalendarEventSource.LIABILITY:
      return moneyDebtPath(event.sourceId);
    default:
      return APP_PATH.PLAN;
  }
}

function defaultSelectedDay(
  year: number,
  month: number,
  dayCount: number,
): number {
  const today = new Date().toISOString().slice(0, 10);
  const monthKey = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
  if (!today.startsWith(monthKey)) return 1;
  return Math.min(Number(today.slice(8, 10)) || 1, dayCount);
}

export function HouseholdCalendarView(props: Props) {
  const t = useTranslations("plan.calendar");
  const locale = useLocale();
  const { year, month } = parseAnchorMonth(props.anchorMonth);
  const dayCount = daysInUtcMonth(year, month - 1);
  const weekStartDay = weekStartDayForLocale(locale);
  const weekdayKeys = orderedWeekdayKeys(locale);
  const cells = calendarMonthCells(year, month, weekStartDay);
  const [selectedDay, setSelectedDay] = useState(() =>
    defaultSelectedDay(year, month, dayCount),
  );

  const selectedDate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  const isUnavailable = props.isUnavailable === true;
  const eventsByDate = isUnavailable ? {} : props.eventsByDate;
  const deficitDates = isUnavailable ? [] : props.deficitDates;
  const payoffMilestoneDates = isUnavailable ? [] : props.payoffMilestoneDates;
  const payoffInboxItemByPlanId = isUnavailable
    ? {}
    : props.payoffInboxItemByPlanId;
  const dayEvents = eventsByDate[selectedDate] ?? [];
  const deficitSet = new Set(deficitDates);
  const milestoneSet = new Set(payoffMilestoneDates);
  const selectedIsDeficit = deficitSet.has(selectedDate);
  const selectedIsMilestone = milestoneSet.has(selectedDate);
  const milestoneEvents = dayEvents.filter((event) => event.isPayoffMilestone);
  const celebrationInboxId =
    milestoneEvents
      .map((event) => payoffInboxItemByPlanId[event.sourceId])
      .find((id): id is string => Boolean(id)) ?? null;
  const monthLabel = formatDate(
    new Date(`${props.anchorMonth.slice(0, 7)}-01T00:00:00.000Z`),
    locale,
    { month: "long", year: "numeric", timeZone: "UTC" },
  );
  const readyCurrency = props.isUnavailable === true ? null : props.currency;

  let dayEventsBody: ReactNode;
  if (isUnavailable) {
    dayEventsBody = (
      <Text size="sm" tone="secondary">
        {t("unavailableBody")}
      </Text>
    );
  } else if (dayEvents.length === 0) {
    dayEventsBody = (
      <Text size="sm" tone="secondary">
        {t("dayEmpty")}
      </Text>
    );
  } else {
    dayEventsBody = (
      <Card tone="elevated" className="gap-0 overflow-hidden p-0">
        <div className="divide-y divide-border-subtle/65">
          {dayEvents.map((event) => (
            <Link
              key={event.id}
              href={eventHref(event)}
              className="flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-3) transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
              data-testid={`calendar-event-${event.source}`}
            >
              <div className="min-w-0 flex-1">
                <Text
                  size="sm"
                  weight="medium"
                  className="truncate text-text-primary"
                >
                  {event.title}
                </Text>
                <Text size="xs" tone="secondary" className="mt-(--space-1)">
                  {t(`sources.${event.source}`)}
                  {event.isPayoffMilestone ? ` · ${t("milestoneBadge")}` : ""}
                </Text>
              </div>
              <Text size="sm" weight="semibold" tabular className="shrink-0">
                <FinancialValue>
                  {formatAmount(
                    event.amount,
                    event.currency || readyCurrency || "",
                  )}
                </FinancialValue>
              </Text>
              <AppIcon
                icon={ACTION_ICONS.forward}
                size={AppIconSize.SM}
                className="shrink-0 text-text-tertiary"
              />
            </Link>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-(--space-5)" data-testid="plan-calendar">
      {isUnavailable ? (
        <StatusAlert
          variant={AlertVariant.INFO}
          title={t("unavailableTitle")}
          description={t("unavailableBody")}
          data-testid="calendar-unavailable"
        />
      ) : (
        <>
          <Card tone="elevated" className="gap-(--space-1) p-(--space-4)">
            <Text size="xs" tone="muted">
              {t("startingBalanceLabel")}
            </Text>
            <Text size="sm" weight="semibold" tabular>
              <FinancialValue>
                {formatAmount(props.startingBalance, props.currency)}
              </FinancialValue>
            </Text>
          </Card>

          <div data-testid="calendar-deficit-banner">
            {deficitDates.length > 0 ? (
              <StatusAlert
                variant={AlertVariant.WARNING}
                title={t("deficitTitle")}
                description={t("deficitBody", {
                  count: String(deficitDates.length),
                  first: deficitDates[0] ?? "",
                })}
              />
            ) : (
              <StatusAlert
                variant={AlertVariant.SUCCESS}
                title={t("deficitClearTitle")}
                description={t("deficitClearBody")}
              />
            )}
          </div>
        </>
      )}

      <CalendarMonthFrame
        monthHeading={t("monthHeading", { month: monthLabel })}
        weekdayLabels={weekdayKeys.map((key) => t(`weekdays.${key}`))}
        previousHref={planCalendarPath(shiftPeriodMonth(props.anchorMonth, -1))}
        nextHref={planCalendarPath(shiftPeriodMonth(props.anchorMonth, 1))}
        previousLabel={t("previousMonth")}
        nextLabel={t("nextMonth")}
        navLabel={t("monthNavLabel")}
        gridLabel={t("gridLabel")}
      >
        {cells.map((day, index) => {
          if (day == null) {
            return <div key={`empty-${index}`} className="min-h-11" />;
          }
          const date = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasEvents = (eventsByDate[date]?.length ?? 0) > 0;
          const isDeficit = deficitSet.has(date);
          const isMilestone = milestoneSet.has(date);
          const isSelected = day === selectedDay;
          return (
            <button
              key={date}
              type="button"
              data-testid={`calendar-day-${day}`}
              aria-pressed={isSelected}
              aria-label={t("dayLabel", {
                date,
                events: String(eventsByDate[date]?.length ?? 0),
              })}
              className={[
                "relative flex min-h-11 flex-col items-center justify-center rounded-(--radius-control) border text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                isSelected
                  ? "border-accent bg-accent/10 font-semibold text-text-primary"
                  : "border-border-subtle bg-surface text-text-primary",
                isDeficit ? "ring-1 ring-warning" : "",
              ].join(" ")}
              onClick={() => setSelectedDay(day)}
            >
              <span>{day}</span>
              <span className="mt-0.5 flex gap-0.5">
                {hasEvents ? (
                  <span
                    className="size-1.5 rounded-full bg-accent"
                    aria-hidden
                  />
                ) : null}
                {isMilestone ? (
                  <span
                    className="size-1.5 rounded-full bg-success"
                    aria-hidden
                    data-testid={`calendar-milestone-dot-${day}`}
                  />
                ) : null}
              </span>
            </button>
          );
        })}
      </CalendarMonthFrame>

      {selectedIsMilestone && milestoneEvents.length > 0 ? (
        <div
          className="flex flex-col gap-(--space-3)"
          data-testid="calendar-payoff-celebration"
        >
          <StatusAlert
            variant={AlertVariant.SUCCESS}
            title={t("payoffTitle")}
            description={t("payoffBody", {
              title: milestoneEvents[0]?.title ?? "",
              date: selectedDate,
            })}
          />
          <Link
            href={
              celebrationInboxId
                ? inboxItemPath(celebrationInboxId)
                : APP_PATH.INBOX
            }
            className={PLAN_ACCENT_LINK_CLASS}
            data-testid="calendar-payoff-inbox"
          >
            {t("payoffInboxCta")}
          </Link>
          <Link
            href={APP_PATH.PLAN_JARS}
            className={PLAN_SURFACE_LINK_CLASS}
            data-testid="calendar-payoff-reallocate"
          >
            {t("payoffReallocateCta")}
          </Link>
        </div>
      ) : null}

      {selectedIsDeficit ? (
        <div data-testid="calendar-day-deficit">
          <StatusAlert
            variant={AlertVariant.WARNING}
            title={t("dayDeficitTitle")}
            description={t("dayDeficitBody", { date: selectedDate })}
          />
        </div>
      ) : null}

      <section
        className="flex flex-col gap-(--space-3)"
        data-testid="calendar-day-events"
      >
        <SectionHeader title={t("dayEventsHeading", { date: selectedDate })} />
        {dayEventsBody}
      </section>
    </div>
  );
}
