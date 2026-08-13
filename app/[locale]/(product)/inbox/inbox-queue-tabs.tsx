"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  InboxQueueTab,
  INBOX_TAB_QUERY,
} from "@/modules/inbox/application/inbox-constants";

type Props = {
  active: InboxQueueTab;
};

/**
 * Open vs Archived inbox tabs (BR-15 / ST-E03-003 / F4).
 */
export function InboxQueueTabs({ active }: Props) {
  const t = useTranslations("inbox");

  const tabs: {
    id: InboxQueueTab;
    href: string;
    label: string;
    testId: string;
  }[] = [
    {
      id: InboxQueueTab.OPEN,
      href: APP_PATH.INBOX,
      label: t("tabOpen"),
      testId: "inbox-tab-open",
    },
    {
      id: InboxQueueTab.ARCHIVED,
      href: `${APP_PATH.INBOX}?${INBOX_TAB_QUERY}=${InboxQueueTab.ARCHIVED}`,
      label: t("tabArchived"),
      testId: "inbox-tab-archived",
    },
  ];

  return (
    <div
      className="flex gap-(--space-2)"
      role="tablist"
      aria-label={t("tabListLabel")}
      data-testid="inbox-queue-tabs"
    >
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            role="tab"
            aria-selected={selected}
            data-testid={tab.testId}
            className={
              selected
                ? "inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-primary-soft px-(--space-3) text-sm font-semibold text-primary ring-1 ring-primary/20 transition-[background-color,color,transform] duration-(--duration-fast) hover:bg-primary/15 active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                : "inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-surface-muted/60 px-(--space-3) text-sm font-medium text-text-secondary transition-[background-color,color,transform] duration-(--duration-fast) hover:bg-surface-hover hover:text-text-primary active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
