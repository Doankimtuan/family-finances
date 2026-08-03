"use client";

import { useTranslations } from "next-intl";
import { HealthCard } from "@/shared/patterns/health-card";
import type { HealthLevel } from "@/modules/health/application/health-pulse";

export function HealthOverviewCard({
  score,
  level,
}: {
  score: number;
  level: HealthLevel;
}) {
  const t = useTranslations("health");

  return (
    <HealthCard
      title={t("chipTitle")}
      score={score}
      levelLabel={t(`levels.${level}`)}
      narrative={t(`narratives.${level}`)}
      data-testid="health-overview-card"
    />
  );
}
