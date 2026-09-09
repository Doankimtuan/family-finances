"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { ACTION_ICONS, UTILITY_ICONS } from "@/shared/ui/icon-registry";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";

/**
 * Home Inbox preview: summary → reason → Inbox. Not a second review system.
 * The whole pending surface navigates; the clear state stays quiet.
 */
export function HomeInboxCta({ openCount }: { openCount: number }) {
  const t = useTranslations("home");
  const hasPending = openCount > 0;

  const summary = (
    <div className="flex min-h-11 items-start gap-(--space-3)">
      <IconContainer
        tone={hasPending ? IconContainerTone.INFO : IconContainerTone.NEUTRAL}
        size="sm"
      >
        <AppIcon
          icon={hasPending ? UTILITY_ICONS.notification : ACTION_ICONS.check}
          size="sm"
        />
      </IconContainer>
      <div className="min-w-0 flex-1">
        <Text size="sm" className="text-pretty text-text-primary">
          {hasPending
            ? t("inbox.pending", { count: openCount })
            : t("inbox.clear")}
        </Text>
        {hasPending ? (
          <Text size="xs" tone="secondary" className="mt-(--space-1)">
            {t("inbox.open")}
          </Text>
        ) : null}
      </div>
      {hasPending ? (
        <AppIcon
          icon={ACTION_ICONS.forward}
          size="sm"
          className="mt-(--space-1) shrink-0 text-text-tertiary"
        />
      ) : null}
    </div>
  );

  if (hasPending) {
    return (
      <Link
        href={APP_PATH.INBOX}
        prefetch={PRODUCT_LINK_PREFETCH}
        aria-label={t("inbox.open")}
        data-testid={HOME_TEST_ID.INBOX_CTA}
        className="block rounded-(--radius-card) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <Card
          tone="warning"
          className="gap-0 p-(--space-3)"
          data-testid={HOME_TEST_ID.INBOX_CONTENT}
        >
          {summary}
        </Card>
      </Link>
    );
  }

  return (
    <Card
      tone="soft"
      className="gap-0 p-(--space-3)"
      data-testid={HOME_TEST_ID.INBOX_CONTENT}
    >
      {summary}
    </Card>
  );
}
