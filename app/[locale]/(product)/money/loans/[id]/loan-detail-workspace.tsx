"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  LoanDetailView,
  LOAN_DETAIL_VIEW_QUERY,
  type LoanDetailView as LoanDetailViewValue,
} from "@/modules/ledger/application/loan-constants";
import {
  MotionStep,
  MotionStepDirection,
  type MotionStepDirection as MotionStepDirectionValue,
} from "@/shared/motion";
import { cn } from "@/shared/utils/cn";

const LOAN_DETAIL_VIEW_ORDER = [
  LoanDetailView.OVERVIEW,
  LoanDetailView.SCHEDULE,
  LoanDetailView.HISTORY,
] as const;

type TabDef = {
  view: LoanDetailViewValue;
  label: string;
};

export function LoanDetailWorkspace({
  initialView,
  tabs,
  overview,
  schedule,
  history,
}: {
  initialView: LoanDetailViewValue;
  tabs: readonly TabDef[];
  overview: ReactNode;
  schedule: ReactNode;
  history: ReactNode;
}) {
  const [view, setView] = useState<LoanDetailViewValue>(initialView);
  const [direction, setDirection] = useState<MotionStepDirectionValue>(
    MotionStepDirection.FORWARD,
  );

  const selectView = useCallback(
    (next: LoanDetailViewValue) => {
      if (next === view) return;
      const from = LOAN_DETAIL_VIEW_ORDER.indexOf(view);
      const to = LOAN_DETAIL_VIEW_ORDER.indexOf(next);
      setDirection(
        to >= from ? MotionStepDirection.FORWARD : MotionStepDirection.BACKWARD,
      );
      setView(next);

      const url = new URL(window.location.href);
      url.searchParams.set(LOAN_DETAIL_VIEW_QUERY, next);
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}`,
      );
    },
    [view],
  );

  const panel =
    view === LoanDetailView.SCHEDULE
      ? schedule
      : view === LoanDetailView.HISTORY
        ? history
        : overview;

  return (
    <div className="flex flex-col gap-(--space-4)">
      <div
        role="tablist"
        aria-label={tabs.map((tab) => tab.label).join(" · ")}
        className="flex gap-(--space-1) rounded-(--radius-control) bg-surface-muted/60 p-(--space-1)"
        data-testid="loan-detail-tabs"
      >
        {tabs.map((tab) => {
          const selected = view === tab.view;
          return (
            <button
              key={tab.view}
              type="button"
              role="tab"
              id={`loan-detail-tab-${tab.view}`}
              aria-selected={selected}
              aria-current={selected ? "page" : undefined}
              aria-controls={`loan-detail-panel-${tab.view}`}
              tabIndex={selected ? 0 : -1}
              data-testid={`loan-detail-tab-${tab.view}`}
              onClick={() => selectView(tab.view)}
              className={cn(
                "inline-flex min-h-11 flex-1 items-center justify-center rounded-(--radius-control) px-(--space-2) text-center text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                selected
                  ? "bg-surface text-text-primary shadow-(--elevation-1)"
                  : "text-text-secondary hover:bg-surface-hover",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`loan-detail-panel-${view}`}
        aria-labelledby={`loan-detail-tab-${view}`}
        data-testid={`loan-detail-panel-${view}`}
      >
        <MotionStep stepKey={view} direction={direction}>
          {panel}
        </MotionStep>
      </div>
    </div>
  );
}
