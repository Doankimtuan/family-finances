"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  InboxQueueTab,
  INBOX_TAB_QUERY,
} from "@/modules/inbox/application/inbox-constants";
import { cn } from "@/shared/utils/cn";

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
      className="flex gap-(--space-1) rounded-full bg-surface-muted p-(--space-1)"
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
            className={cn(
              "inline-flex min-h-10 flex-1 items-center justify-center rounded-full px-(--space-3) text-sm transition-[background-color,color,transform,box-shadow] duration-(--duration-fast) active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
              selected
                ? "bg-surface font-semibold text-text-primary shadow-(--elevation-1)"
                : "font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
