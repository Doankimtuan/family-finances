"use client";

import { useId, useState, type ReactNode } from "react";
import { PLAN_INLINE_LINK_CLASS } from "./plan-chrome";

type PlanDisclosureProps = {
  showLabel: string;
  hideLabel: string;
  testId: string;
  children: ReactNode;
};

/**
 * Client disclosure leaf matching the Money hub show-all pattern.
 * Collapsed content stays unmounted so it is not interactive.
 */
export function PlanDisclosure({
  showLabel,
  hideLabel,
  testId,
  children,
}: PlanDisclosureProps) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  return (
    <div className="flex flex-col gap-(--space-3)">
      <button
        type="button"
        className={`${PLAN_INLINE_LINK_CLASS} w-fit`}
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded((value) => !value)}
        data-testid={testId}
      >
        {expanded ? hideLabel : showLabel}
      </button>
      <div id={contentId} hidden={!expanded}>
        {expanded ? children : null}
      </div>
    </div>
  );
}
