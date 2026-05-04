"use client";

import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { useI18n } from "@/lib/providers/i18n-provider";
import type { DashboardCoreResponse } from "@/lib/dashboard/types";
import { HealthFactor } from "./ui";

export function HealthFactors({
  healthData,
}: {
  healthData: NonNullable<DashboardCoreResponse["health"]>;
}) {
  const { t } = useI18n();

  if (!healthData) return null;

  return (
    <Card className="border-border/60 bg-linear-to-br from-amber-50 via-orange-50 to-white">
      <CardHeader className="pb-3">
        <SectionHeader
          icon={Zap}
          label={t("dashboard.health.label")}
          title={t("dashboard.health.title")}
          description={t("dashboard.health.description")}
        />
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HealthFactor
          label={t("dashboard.health.factor.cashflow")}
          score={healthData.factorScores.cashflow}
          color="bg-amber-500"
        />
        <HealthFactor
          label={t("dashboard.health.factor.emergency")}
          score={healthData.factorScores.emergency}
          color="bg-emerald-500"
        />
        <HealthFactor
          label={t("dashboard.health.factor.debt")}
          score={healthData.factorScores.debt}
          color="bg-blue-500"
        />
        <HealthFactor
          label={t("dashboard.health.factor.goals")}
          score={healthData.factorScores.goals}
          color="bg-purple-500"
        />
      </CardContent>
    </Card>
  );
}
