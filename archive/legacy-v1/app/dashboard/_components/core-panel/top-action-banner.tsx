"use client";

import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/providers/i18n-provider";

export function TopActionBanner({
  healthScore,
  topAction,
}: {
  healthScore: number | null;
  topAction: string;
}) {
  const { t } = useI18n();

  return (
    <Card className="border-warning/20 bg-warning/10 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-warning/20 bg-background/70 px-3 py-1 text-warning">
            <Sparkles className="h-4 w-4" />
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]">
              {t("dashboard.hero.top_action")}
            </p>
          </div>
          <p className="text-sm font-semibold leading-6 text-foreground sm:text-base">
            {healthScore === null ? t("dashboard.hero.health_pending") : topAction}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
