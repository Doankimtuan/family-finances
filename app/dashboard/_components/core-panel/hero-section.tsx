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
    <Card className="overflow-hidden border-none bg-linear-to-br from-primary via-primary/80 to-accent text-white shadow-xl">
      <CardContent className="relative p-6 sm:p-8">
        <div className="absolute -right-8 top-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="relative space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/70">
              {t("dashboard.hero.eyebrow")}
            </p>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {formatVndCompact(Number(metrics.net_worth), locale)}
                </p>
                <p className="text-sm text-white/80">
                  {formatVnd(Number(metrics.net_worth), locale)}
                </p>
                <p className="max-w-2xl text-sm leading-6 text-white/80">
                  {t("dashboard.hero.description")}
                </p>
              </div>
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="shrink-0 rounded-full border-0 bg-white/15 text-white hover:bg-white/25"
              >
                <Link href="/money">
                  {t("dashboard.hero.open_money")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <HeroStat
              label={t("dashboard.hero.health_score")}
              value={healthScore === null ? "-" : `${healthScore.toFixed(0)}/100`}
            />
            <HeroStat
              label={t("dashboard.hero.emergency_fund")}
              value={formatMonths(metrics.emergency_months ?? 0, locale)}
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
