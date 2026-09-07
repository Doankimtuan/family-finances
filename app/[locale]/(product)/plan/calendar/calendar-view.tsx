"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  APP_PATH,
  inboxItemPath,
  moneyAccountPath,
  moneyDebtPath,
  moneyLoanPath,
  planRecurringPath,
} from "@/modules/tenancy/application/app-path";
import {
  CalendarEventSource,
  type CalendarEvent,
} from "@/modules/plan/application/client";
import { Text } from "@/shared/ui/text";
import { Card } from "@/shared/patterns/card";
import { StatusAlert } from "@/shared/ui/status-alert";
import { SectionHeader } from "@/shared/patterns/section-header";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import {
  PLAN_ACCENT_LINK_CLASS,
  PLAN_SURFACE_LINK_CLASS,
} from "../plan-chrome";

type Props = {
  anchorMonth: string;
  currency: string;
  events: CalendarEvent[];
  eventsByDate: Record<string, CalendarEvent[]>;
  deficitDates: string[];
  payoffMilestoneDates: string[];
  startingBalance: number;
  payoffInboxItemByPlanId: Record<string, string>;
};

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function parseMonth(anchorMonth: string): { y: number; m: number } {
  const [y, m] = anchorMonth.split("-").map(Number);
  return { y, m };
}

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

export function HouseholdCalendarView({
  anchorMonth,
  currency,
  eventsByDate,
  deficitDates,
  payoffMilestoneDates,
  startingBalance,
  payoffInboxItemByPlanId,
}: Props) {
  const t = useTranslations("plan.calendar");
  const { y, m } = parseMonth(anchorMonth);
  const dim = daysInMonth(y, m - 1);
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const today = new Date().toISOString().slice(0, 10);
  const defaultDay = Math.min(Number(today.slice(8, 10)) || 1, dim);
  const [selectedDay, setSelectedDay] = useState(defaultDay);

  const selectedDate = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  const dayEvents = eventsByDate[selectedDate] ?? [];
  const deficitSet = useMemo(() => new Set(deficitDates), [deficitDates]);
  const milestoneSet = useMemo(
    () => new Set(payoffMilestoneDates),
    [payoffMilestoneDates],
  );
  const selectedIsDeficit = deficitSet.has(selectedDate);
  const selectedIsMilestone = milestoneSet.has(selectedDate);
  const milestoneEvents = dayEvents.filter((e) => e.isPayoffMilestone);
  const celebrationInboxId =
    milestoneEvents
      .map((e) => payoffInboxItemByPlanId[e.sourceId])
      .find((id): id is string => Boolean(id)) ?? null;

  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let d = 1; d <= dim; d += 1) cells.push(d);

  return (
    <div className="flex flex-col gap-(--space-5)" data-testid="plan-calendar">
      <Card tone="elevated" className="gap-(--space-1) p-(--space-4)">
        <Text size="xs" tone="muted">
          {t("startingBalanceLabel")}
        </Text>
        <Text size="sm" weight="semibold" tabular>
          <FinancialValue>
            {formatAmount(startingBalance, currency)}
          </FinancialValue>
        </Text>
      </Card>

      <div data-testid="calendar-deficit-banner">
        {deficitDates.length > 0 ? (
          <StatusAlert
            variant="warning"
            title={t("deficitTitle")}
            description={t("deficitBody", {
              count: String(deficitDates.length),
              first: deficitDates[0] ?? "",
            })}
          />
        ) : (
          <StatusAlert
            variant="success"
            title={t("deficitClearTitle")}
            description={t("deficitClearBody")}
          />
        )}
      </div>

      <Card
        tone="elevated"
        className="gap-(--space-3) p-(--space-4)"
        data-testid="calendar-grid"
      >
        <SectionHeader
          title={t("monthHeading", { month: anchorMonth.slice(0, 7) })}
        />
        <div className="grid grid-cols-7 gap-(--space-1) text-center text-xs text-text-secondary">
          {(["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const).map(
            (key) => (
              <span key={key} className="py-(--space-1)">
                {t(`weekdays.${key}`)}
              </span>
            ),
          )}
        </div>
        <div className="grid grid-cols-7 gap-(--space-1)">
          {cells.map((day, index) => {
            if (day == null) {
              return <div key={`empty-${index}`} className="min-h-11" />;
            }
            const date = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
        </div>
      </Card>

      {selectedIsMilestone && milestoneEvents.length > 0 ? (
        <div
          className="flex flex-col gap-(--space-3)"
          data-testid="calendar-payoff-celebration"
        >
          <StatusAlert
            variant="success"
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
            variant="warning"
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
        {dayEvents.length === 0 ? (
          <Text size="sm" tone="secondary">
            {t("dayEmpty")}
          </Text>
        ) : (
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
                      {event.isPayoffMilestone
                        ? ` · ${t("milestoneBadge")}`
                        : ""}
                    </Text>
                  </div>
                  <Text
                    size="sm"
                    weight="semibold"
                    tabular
                    className="shrink-0"
                  >
                    <FinancialValue>
                      {formatAmount(event.amount, event.currency || currency)}
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
        )}
      </section>
    </div>
  );
}
