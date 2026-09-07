import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/shared/patterns/card";
import { Heading } from "@/shared/ui/heading";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";

const MONTH_NAV_CONTROL_CLASS =
  "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-(--radius-control) text-text-primary transition-[background-color,color,transform] duration-(--duration-fast) ease-(--ease-standard) hover:bg-surface-hover active:scale-(--press-scale) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100";

type CalendarPath =
  string | { pathname: string; query: Record<string, string> };

export type CalendarMonthFrameProps = {
  monthHeading: ReactNode;
  weekdayLabels: readonly ReactNode[];
  children: ReactNode;
  previousHref?: CalendarPath;
  nextHref?: CalendarPath;
  previousLabel?: string;
  nextLabel?: string;
  navLabel?: string;
  gridLabel?: string;
};

export function CalendarMonthFrame({
  monthHeading,
  weekdayLabels,
  children,
  previousHref,
  nextHref,
  previousLabel,
  nextLabel,
  navLabel,
  gridLabel,
}: CalendarMonthFrameProps) {
  return (
    <Card
      tone="elevated"
      className="gap-(--space-3) p-(--space-4)"
      data-testid="calendar-grid"
      aria-label={gridLabel}
    >
      <div
        className="flex items-center gap-(--space-2)"
        data-testid="calendar-month-nav"
        aria-label={navLabel}
      >
        {previousHref && previousLabel ? (
          <Link
            href={previousHref}
            aria-label={previousLabel}
            className={MONTH_NAV_CONTROL_CLASS}
            data-testid="calendar-month-previous"
          >
            <AppIcon
              icon={ACTION_ICONS.back}
              size={AppIconSize.MD}
              emphasized
            />
          </Link>
        ) : (
          <span
            className="inline-flex min-h-11 min-w-11 shrink-0"
            data-testid="calendar-month-previous-placeholder"
            aria-hidden
          />
        )}
        <Heading
          level={2}
          className="min-w-0 flex-1 text-center text-lg leading-snug"
          data-testid="calendar-month-heading"
          aria-live="polite"
        >
          {monthHeading}
        </Heading>
        {nextHref && nextLabel ? (
          <Link
            href={nextHref}
            aria-label={nextLabel}
            className={MONTH_NAV_CONTROL_CLASS}
            data-testid="calendar-month-next"
          >
            <AppIcon
              icon={ACTION_ICONS.forward}
              size={AppIconSize.MD}
              emphasized
            />
          </Link>
        ) : (
          <span
            className="inline-flex min-h-11 min-w-11 shrink-0"
            data-testid="calendar-month-next-placeholder"
            aria-hidden
          />
        )}
      </div>
      <div
        className="grid grid-cols-7 gap-(--space-1) text-center text-xs text-text-secondary"
        data-testid="calendar-weekdays"
      >
        {weekdayLabels.map((label, index) => (
          <span
            key={typeof label === "string" ? label : `weekday-${index}`}
            className="py-(--space-1)"
          >
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-(--space-1)">{children}</div>
    </Card>
  );
}
