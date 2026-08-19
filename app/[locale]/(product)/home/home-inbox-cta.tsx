"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { AppIcon } from "@/shared/ui/app-icon";
import { Button } from "@/shared/ui/button";
import { IconContainer } from "@/shared/ui/icon-container";
import { ACTION_ICONS, UTILITY_ICONS } from "@/shared/ui/icon-registry";
import { cn } from "@/shared/utils/cn";

export function HomeInboxCta({ openCount }: { openCount: number }) {
  const t = useTranslations("home");
  const router = useRouter();
  const hasPending = openCount > 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-(--space-3)",
        hasPending &&
          "rounded-(--radius-card) border border-warning/20 bg-warning/5 p-(--space-3)",
      )}
      data-testid={HOME_TEST_ID.INBOX_CONTENT}
    >
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
    </div>
  );
}
