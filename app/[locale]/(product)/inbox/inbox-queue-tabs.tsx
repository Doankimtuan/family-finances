"use client";

import { useTranslations } from "next-intl";
import {
  InboxQueueTab,
  INBOX_QUEUE_TAB_VALUES,
  INBOX_TEST_ID,
} from "@/modules/inbox/application/inbox-constants";
import { cn } from "@/shared/utils/cn";
import { useInboxQueueTransition } from "./inbox-queue-transition";

const INBOX_QUEUE_TAB_UI = {
  [InboxQueueTab.OPEN]: {
    labelKey: "tabOpen",
    testId: INBOX_TEST_ID.TAB_OPEN,
  },
  [InboxQueueTab.ARCHIVED]: {
    labelKey: "tabArchived",
    testId: INBOX_TEST_ID.TAB_ARCHIVED,
  },
} as const;

/**
 * Open vs Archived inbox tabs (BR-15 / ST-E03-003 / F4).
 * Selection paints immediately; the list fetch continues in a transition.
 */
export function InboxQueueTabs() {
  const t = useTranslations("inbox");
  const { isSwitching, optimisticTab, selectTab } = useInboxQueueTransition();

  return (
    <div
      className="flex gap-(--space-1) rounded-full bg-surface-muted p-(--space-1)"
      role="tablist"
      aria-label={t("tabListLabel")}
      aria-busy={isSwitching}
      data-testid={INBOX_TEST_ID.QUEUE_TABS}
    >
      {INBOX_QUEUE_TAB_VALUES.map((tabId) => {
        const tab = { id: tabId, ...INBOX_QUEUE_TAB_UI[tabId] };
        const selected = optimisticTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={isSwitching}
            data-testid={tab.testId}
            onClick={() => selectTab(tab.id)}
            className={cn(
              "inline-flex min-h-10 flex-1 items-center justify-center rounded-full px-(--space-3) text-sm transition-[background-color,color,transform,box-shadow] duration-(--duration-fast) active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
              selected
                ? "bg-surface font-semibold text-text-primary shadow-(--elevation-1)"
                : "font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary",
              isSwitching && "cursor-not-allowed",
            )}
          >
            {t(tab.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
