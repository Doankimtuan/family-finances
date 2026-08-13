"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { Button } from "@/shared/ui/button";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";

/** Contextual daily-capture action placed beside the current financial position. */
export function HomeCaptureAction() {
  const t = useTranslations("home");
  const router = useRouter();
  const { online } = useOnlineStatusClient();

  return (
    <Button
      variant="tertiary"
      className="min-h-10 shrink-0 rounded-full border border-expense/20 bg-expense/10 px-(--space-3) text-sm text-expense shadow-none hover:bg-expense/15 data-[hover=true]:bg-expense/15"
      isDisabled={!online}
      data-testid="home-capture"
      onPress={() => router.push(APP_PATH.MONEY_ADD)}
    >
      <AppIcon icon={ACTION_ICONS.add} size="sm" />
      {t("capture")}
    </Button>
  );
}
