import {
  CalendarEventSource,
  type CalendarEventSource as CalendarEventSourceValue,
} from "@/modules/plan/application/plan-constants";
import type { CalendarEvent } from "@/modules/plan/application/calendar-projection";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FINANCE_ICONS, PLAN_ICONS } from "@/shared/ui/icon-registry";
import { IconContainerTone } from "@/shared/ui/icon-container";
import type { IconSvgElement } from "@hugeicons/react";

export type CalendarEventPresentation = {
  icon: IconSvgElement;
  tone: IconContainerTone;
  kind: FinancialNumberKind;
};

const CALENDAR_EVENT_PRESENTATION: Record<
  CalendarEventSourceValue,
  CalendarEventPresentation
> = {
  [CalendarEventSource.RECURRING]: {
    icon: PLAN_ICONS.recurring,
    tone: IconContainerTone.TRANSFER,
    kind: FinancialNumberKind.INTENTION,
  },
  [CalendarEventSource.CARD_DUE]: {
    icon: FINANCE_ICONS.card,
    tone: IconContainerTone.EXPENSE,
    kind: FinancialNumberKind.CURRENT_STATE,
  },
  [CalendarEventSource.LOAN]: {
    icon: FINANCE_ICONS.loan,
    tone: IconContainerTone.DEBT,
    kind: FinancialNumberKind.CURRENT_STATE,
  },
  [CalendarEventSource.LIABILITY]: {
    icon: FINANCE_ICONS.debt,
    tone: IconContainerTone.DEBT,
    kind: FinancialNumberKind.CURRENT_STATE,
  },
  [CalendarEventSource.PAYOFF_MILESTONE]: {
    icon: FINANCE_ICONS.loan,
    tone: IconContainerTone.SAVINGS,
    kind: FinancialNumberKind.CURRENT_STATE,
  },
};

export function calendarEventPresentation(
  source: CalendarEventSourceValue,
): CalendarEventPresentation {
  return CALENDAR_EVENT_PRESENTATION[source];
}

export function monthHasEvents(
  eventsByDate: Record<string, CalendarEvent[]>,
): boolean {
  for (const events of Object.values(eventsByDate)) {
    if (events.length > 0) return true;
  }
  return false;
}
