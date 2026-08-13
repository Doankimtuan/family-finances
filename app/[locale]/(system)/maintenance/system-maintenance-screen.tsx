"use client";

import { useTranslations } from "next-intl";
import { Wrench01Icon } from "@hugeicons/core-free-icons";
import { AppIcon } from "@/shared/ui/app-icon";
import { SystemShell } from "@/shared/patterns/system-shell";

/**
 * system.maintenance — terminal planned downtime shell (ST-E08-001).
 */
export function SystemMaintenanceScreen() {
  const t = useTranslations("system.maintenance");

  return (
    <SystemShell
      data-testid="system-maintenance"
      title={t("title")}
      description={t("body")}
      icon={
        <AppIcon icon={Wrench01Icon} size="xl" className="text-text-secondary" />
      }
    />
  );
}
