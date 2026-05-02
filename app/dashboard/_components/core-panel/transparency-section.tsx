"use client";

import { ChevronRight, Info } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { useI18n } from "@/lib/providers/i18n-provider";
import { TransparencyList } from "./ui";

export function TransparencySection({
  drilldowns,
}: {
  drilldowns: any;
}) {
  const { locale, t } = useI18n();

  if (!drilldowns) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <SectionHeader
          icon={Info}
          label={t("dashboard.transparency.label")}
          title={t("dashboard.transparency.title")}
          description={t("dashboard.transparency.description")}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <details className="group rounded-2xl border border-border/60 bg-muted/10 p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {t("dashboard.transparency.networth")}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition group-open:rotate-90" />
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TransparencyList
              title={t("dashboard.transparency.assets")}
              rows={drilldowns.netWorth.assets ?? []}
              locale={locale}
              tone="success"
            />
            <TransparencyList
              title={t("dashboard.transparency.liabilities")}
              rows={drilldowns.netWorth.liabilities ?? []}
              locale={locale}
              tone="destructive"
            />
          </div>
        </details>

        <details className="group rounded-2xl border border-border/60 bg-muted/10 p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {t("dashboard.transparency.cashflow")}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition group-open:rotate-90" />
          </summary>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("dashboard.transparency.window")}:{" "}
            {drilldowns.cashFlow.monthStart} - {drilldowns.cashFlow.monthEnd}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TransparencyList
              title={t("dashboard.transparency.income")}
              rows={drilldowns.cashFlow.income ?? []}
              locale={locale}
              tone="success"
            />
            <TransparencyList
              title={t("dashboard.transparency.spending")}
              rows={drilldowns.cashFlow.expense ?? []}
              locale={locale}
              tone="destructive"
            />
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
