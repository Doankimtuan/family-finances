"use client";

import { useRef, type KeyboardEvent } from "react";
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

const TAB_KEY = {
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
} as const;

/**
 * Open vs Archived inbox tabs (BR-15 / ST-E03-003 / F4).
 * Selection paints immediately; the list fetch continues in a transition.
 */
export function InboxQueueTabs() {
  const t = useTranslations("inbox");
  const { isSwitching, optimisticTab, selectTab } = useInboxQueueTransition();
  const tabRefs = useRef<
    Partial<Record<InboxQueueTab, HTMLButtonElement | null>>
  >({});

  const moveToTab = (nextTab: InboxQueueTab) => {
    selectTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  const onTabListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = INBOX_QUEUE_TAB_VALUES.indexOf(optimisticTab);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    switch (event.key) {
      case TAB_KEY.ARROW_RIGHT:
        nextIndex = (currentIndex + 1) % INBOX_QUEUE_TAB_VALUES.length;
        break;
      case TAB_KEY.ARROW_LEFT:
        nextIndex =
          (currentIndex - 1 + INBOX_QUEUE_TAB_VALUES.length) %
          INBOX_QUEUE_TAB_VALUES.length;
        break;
      case TAB_KEY.HOME:
        nextIndex = 0;
        break;
      case TAB_KEY.END:
        nextIndex = INBOX_QUEUE_TAB_VALUES.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextTab = INBOX_QUEUE_TAB_VALUES[nextIndex];
    if (nextTab) moveToTab(nextTab);
  };

  return (
    <div
      className="flex gap-(--space-1) rounded-full bg-surface-muted p-(--space-1)"
      role="tablist"
      aria-label={t("tabListLabel")}
      aria-busy={isSwitching}
      data-testid={INBOX_TEST_ID.QUEUE_TABS}
      onKeyDown={onTabListKeyDown}
    >
      {INBOX_QUEUE_TAB_VALUES.map((tabId) => {
        const tab = { id: tabId, ...INBOX_QUEUE_TAB_UI[tabId] };
        const selected = optimisticTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={tab.testId}
            ref={(node) => {
              tabRefs.current[tab.id] = node;
            }}
            aria-selected={selected}
            aria-controls={INBOX_TEST_ID.TAB_CONTENT}
            tabIndex={selected ? 0 : -1}
            data-testid={tab.testId}
            onClick={() => selectTab(tab.id)}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-(--space-3) text-sm transition-[background-color,color,transform,box-shadow] duration-(--duration-fast) active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
              selected
                ? "bg-surface font-semibold text-text-primary shadow-(--elevation-1)"
                : "font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary",
              isSwitching && "cursor-wait",
            )}
          >
            {t(tab.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
