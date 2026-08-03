"use client";

import { useTranslations } from "next-intl";
import { LockKey } from "@phosphor-icons/react";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { SystemShell } from "@/shared/patterns/system-shell";
import { Button } from "@/shared/ui/button";

/**
 * system.permission — admin elevation explained (AC-020 / BR-13).
 */
export function SystemPermissionScreen({
  reason = "admin",
}: {
  reason?: "admin" | "general";
}) {
  const t = useTranslations("system.permission");
  const router = useRouter();

  return (
    <SystemShell
      data-testid="system-permission"
      title={t("title")}
      description={reason === "admin" ? t("adminBody") : t("body")}
      icon={
        <LockKey
          size={36}
          weight="duotone"
          className="text-text-secondary"
          aria-hidden
        />
      }
      actions={
        <>
          <Button
            variant="primary"
            className="min-h-11 w-full"
            data-testid="system-permission-together"
            onPress={() => router.push(APP_PATH.TOGETHER)}
          >
            {t("backTogether")}
          </Button>
          <Button
            variant="secondary"
            className="min-h-11 w-full"
            data-testid="system-permission-home"
            onPress={() => router.push(APP_PATH.HOME)}
          >
            {t("home")}
          </Button>
        </>
      }
    />
  );
}
