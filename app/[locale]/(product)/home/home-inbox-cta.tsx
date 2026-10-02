"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { AppIcon } from "@/shared/ui/app-icon";
import { Heading } from "@/shared/ui/heading";
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
    <div className="flex w-full items-center gap-(--space-3)">
      <div className="flex min-w-0 flex-1 items-center gap-(--space-3)">
        <IconContainer
          tone={hasPending ? IconContainerTone.INFO : IconContainerTone.NEUTRAL}
          size="md"
          className={
            hasPending
              ? "border border-warning/35 bg-warning/10 text-warning"
              : undefined
          }
        >
          <AppIcon
            icon={hasPending ? UTILITY_ICONS.shield : ACTION_ICONS.check}
            size="sm"
          />
        </IconContainer>
        <div className="flex min-w-0 flex-1 flex-col gap-(--space-1)">
          {hasPending ? (
            <>
              <div className="flex items-center gap-(--space-1)">
                <Heading
                  level={3}
                  className="text-sm font-semibold tracking-tight text-warning"
                >
                  {t("inbox.pending", { count: openCount })}
                </Heading>
                <span
                  className="size-1.5 rounded-full bg-warning"
                  aria-hidden="true"
                />
              </div>
              <Text size="xs" tone="secondary" className="text-pretty">
                {t("inbox.pendingDetail")}
              </Text>
            </>
          ) : (
            <Text
              size="sm"
              weight="semibold"
              className="text-pretty text-text-primary"
            >
              {t("inbox.clear")}
            </Text>
          )}
        </div>
      </div>
      {hasPending ? (
        <div className="flex shrink-0 items-center gap-(--space-1) text-sm font-semibold text-warning">
          <span>{t("inbox.open")}</span>
          <AppIcon icon={ACTION_ICONS.forward} size="xs" className="shrink-0" />
        </div>
      ) : null}
    </div>
  );

  if (hasPending) {
    return (
      <Link
        href={APP_PATH.INBOX}
        prefetch={PRODUCT_LINK_PREFETCH}
        data-testid={HOME_TEST_ID.INBOX_CTA}
        className="block rounded-(--radius-card) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <Card
          tone="warning"
          className="gap-0 border border-warning/35 bg-linear-to-br from-warning/15 via-warning/10 to-warning/5 p-(--space-3) shadow-xs transition-[border-color,transform] hover:border-warning/50 active:scale-(--press-scale) motion-reduce:transform-none motion-reduce:transition-none motion-reduce:active:scale-100"
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
