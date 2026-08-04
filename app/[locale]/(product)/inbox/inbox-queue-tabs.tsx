"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

type TabId = "open" | "archived";

type Props = {
  active: TabId;
};

/**
 * Open vs Archived inbox tabs (BR-15 / ST-E03-003).
 */
export function InboxQueueTabs({ active }: Props) {
  const t = useTranslations("inbox");

  const tabs: { id: TabId; href: string; label: string; testId: string }[] = [
    {
      id: "open",
      href: APP_PATH.INBOX,
      label: t("tabOpen"),
      testId: "inbox-tab-open",
    },
    {
      id: "archived",
      href: `${APP_PATH.INBOX}?tab=archived`,
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
                ? "inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-accent px-(--space-3) text-sm font-medium text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                : "inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
