"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatMonths,
  formatVnd,
  formatVndCompact,
} from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import { HeroStat } from "./ui";

type HeroSectionProps = {
  metrics: {
    net_worth: number;
    emergency_months: number | null;
  };
  healthScore: number | null;
  tdsrValue: number;
  debtPressureNote: string;
};

export function HeroSection({
  metrics,
  healthScore,
  tdsrValue,
  debtPressureNote,
}: HeroSectionProps) {
  const { locale, t } = useI18n();

  return (
    <Card variant="elevated" className="overflow-hidden border-primary/15 bg-secondary/30">
      <CardContent className="p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] lg:items-start">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                {t("dashboard.hero.eyebrow")}
              </p>
              <div className="space-y-3">
                <p className="font-serif text-4xl font-semibold tabular-nums tracking-tight text-primary sm:text-5xl lg:text-6xl">
                  {formatVndCompact(Number(metrics.net_worth), locale)}
                </p>
                <p className="text-sm tabular-nums text-muted-foreground">
                  {formatVnd(Number(metrics.net_worth), locale)}
                </p>
                <p className="max-w-prose text-sm leading-6 text-muted-foreground sm:text-base">
                  {t("dashboard.hero.description")}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/accounts">
                  {t("dashboard.hero.open_money")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <HeroStat
              label={t("dashboard.hero.health_score")}
              value={
                healthScore === null ? "-" : `${healthScore.toFixed(0)}/100`
              }
              note={
                healthScore === null
                  ? t("dashboard.hero.health_pending")
                  : undefined
              }
            />
            <HeroStat
              label={t("dashboard.hero.emergency_fund")}
              value={formatMonths(metrics.emergency_months ?? 0, locale)}
              note={t("dashboard.hero.emergency_fund")}
            />
            <HeroStat
              label={t("dashboard.hero.debt_pressure")}
              value={
                Number.isFinite(tdsrValue) ? `${tdsrValue.toFixed(1)}%` : "-"
              }
              note={debtPressureNote}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
