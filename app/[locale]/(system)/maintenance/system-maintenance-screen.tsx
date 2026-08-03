"use client";

import { useTranslations } from "next-intl";
import { Wrench } from "@phosphor-icons/react";
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
        <Wrench
          size={36}
          weight="duotone"
          className="text-text-secondary"
          aria-hidden
        />
      }
    />
  );
}
