"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { HealthCard } from "@/shared/patterns/health-card";
import type { HealthLevel } from "@/modules/health/application/health-pulse";

export function HomeHealthChip({
  score,
  level,
}: {
  score: number;
  level: HealthLevel;
}) {
  const t = useTranslations("home");
  const router = useRouter();

  return (
    <HealthCard
      title={t("health.title")}
      score={score}
      levelLabel={t(`health.levels.${level}`)}
      narrative={t(`health.narratives.${level}`)}
      data-testid="home-health-chip"
      onPress={() => router.push(APP_PATH.HEALTH)}
    />
  );
}
