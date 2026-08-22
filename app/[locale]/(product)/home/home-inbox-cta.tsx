"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { AppIcon } from "@/shared/ui/app-icon";
import { Button } from "@/shared/ui/button";
import { IconContainer } from "@/shared/ui/icon-container";
import { ACTION_ICONS, UTILITY_ICONS } from "@/shared/ui/icon-registry";
import { Card } from "@/shared/patterns/card";

export function HomeInboxCta({ openCount }: { openCount: number }) {
  const t = useTranslations("home");
  const router = useRouter();
  const hasPending = openCount > 0;

  const content = (
    <>
      <div className="flex items-start gap-(--space-3)">
        <IconContainer tone={hasPending ? "info" : "neutral"} size="sm">
          <AppIcon
            icon={hasPending ? UTILITY_ICONS.notification : ACTION_ICONS.check}
            size="sm"
          />
        </IconContainer>
        <p className="min-w-0 text-sm leading-relaxed text-text-secondary">
          {hasPending
            ? t("inbox.pending", { count: openCount })
            : t("inbox.clear")}
        </p>
      </div>
      {hasPending ? (
        <Button
          variant="secondary"
          className="min-h-11 w-full"
          data-testid={HOME_TEST_ID.INBOX_CTA}
          onPress={() => router.push(APP_PATH.INBOX)}
        >
          {t("inbox.open")}
        </Button>
      ) : null}
    </>
  );

  // Pending items get the shared attention surface; the clear state stays
  // quiet directly on the canvas.
  return hasPending ? (
    <Card
      tone="warning"
      className="gap-(--space-3) p-(--space-3)"
      data-testid={HOME_TEST_ID.INBOX_CONTENT}
    >
      {content}
    </Card>
  ) : (
    <div
      className="flex flex-col gap-(--space-3)"
      data-testid={HOME_TEST_ID.INBOX_CONTENT}
    >
      {content}
    </div>
  );
}
