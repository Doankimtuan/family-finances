"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/providers/i18n-provider";

export function TopActionBanner({
  healthScore,
  topAction,
  financialHealthEnabled,
}: {
  healthScore: number | null;
  topAction: string;
  financialHealthEnabled: boolean;
}) {
  const { t } = useI18n();

  return (
    <Card className="border-warning/30 bg-warning/10 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-warning">
            <Sparkles className="h-4.5 w-4.5" />
            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              {t("dashboard.hero.top_action")}
            </p>
          </div>
          <p className="text-sm font-semibold leading-6 text-foreground">
            {healthScore === null ? t("dashboard.hero.health_pending") : topAction}
          </p>
        </div>
        {financialHealthEnabled ? (
          <Button
            asChild
            variant="outline"
            className="shrink-0 border-warning/40 bg-card/80"
          >
            <Link href="/health">{t("dashboard.health.open")}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
