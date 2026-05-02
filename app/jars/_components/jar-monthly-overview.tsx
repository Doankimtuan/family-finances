import Link from "next/link";
import { formatVndCompact } from "@/lib/dashboard/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { JarEntryDialog } from "./jar-entry-dialog";
import { JarSettingsDialog } from "./jar-settings-dialog";
import { JarTargetDialog } from "./jar-target-dialog";

import { useI18n } from "@/lib/providers/i18n-provider";

type JarRow = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
};

type OverviewRow = {
  jar_id: string;
  target_amount: number;
  allocated_amount: number;
  withdrawn_amount: number;
  net_amount: number;
  coverage_ratio: number;
  jar_coverage_ratio_percent: number | null;
};

type TargetRow = {
  jar_id: string;
  target_mode: "fixed" | "percent";
  target_value: number;
};

import type { AppLanguage } from "@/lib/i18n/config";

type Props = {
  jars: JarRow[];
  overviewMap: Map<string, OverviewRow>;
  targetMap: Map<string, TargetRow>;
  spendingAlertMap: Map<
    string,
    {
      jarId: string;
      alertLevel: "normal" | "warning" | "exceeded";
      usagePercent: number | null;
      spent: number;
      limit: number;
    }
  >;
  month: string;
  householdLocale: string;
  language: AppLanguage;
};

export function JarMonthlyOverview({
  jars,
  overviewMap,
  targetMap,
  spendingAlertMap,
  month,
  householdLocale,
}: Props) {
  const { t, language } = useI18n();
  if (jars.length === 0) {
    return (
      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
        {t("jars.overview.empty")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {jars.map((jar) => {
        const ov = overviewMap.get(jar.id);
        const target = targetMap.get(jar.id);
        const alert = spendingAlertMap.get(jar.id);
        const coverage = Math.round(Number(ov?.coverage_ratio ?? 0) * 100);
        const essentialsCoverage = Number(ov?.jar_coverage_ratio_percent);
        const showEssentialsWarning =
          jar.slug === "necessities"
          && Number.isFinite(essentialsCoverage)
          && essentialsCoverage < 100;

        return (
          <Card key={jar.id} className="border-border/60 shadow-sm">
            <CardHeader className="space-y-3 pb-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base">{jar.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("jars.overview.track_description")}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {alert && alert.alertLevel !== "normal" ? (
                    <Badge
                      className={
                        alert.alertLevel === "exceeded"
                          ? "bg-rose-100 text-rose-700 border-rose-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      }
                    >
                      {alert.alertLevel === "exceeded"
                        ? t("jars.status.exceeded")
                        : t("jars.status.needs_attention")}
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      {t("jars.status.on_track")}
                    </Badge>
                  )}
                  {showEssentialsWarning ? (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                      {t("jars.status.essentials_underfunded")}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, coverage))}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 text-sm">
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">
                    {t("jars.field.fixed_target")}
                  </Label>
                  <p className="font-semibold">
                    {formatVndCompact(Number(ov?.target_amount ?? 0), householdLocale)}
                  </p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">
                    {t("jars.item.allocated")}
                  </Label>
                  <p className="font-semibold text-emerald-600">
                    {formatVndCompact(Number(ov?.allocated_amount ?? 0), householdLocale)}
                  </p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">
                    {t("jars.item.withdrawn")}
                  </Label>
                  <p className="font-semibold text-amber-600">
                    {formatVndCompact(Number(ov?.withdrawn_amount ?? 0), householdLocale)}
                  </p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">
                    {t("jars.item.current_balance")}
                  </Label>
                  <p className="font-semibold">
                    {formatVndCompact(Number(ov?.net_amount ?? 0), householdLocale)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-slate-50/60 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <Label className="font-medium text-foreground">
                    {t("jars.status.monthly_status")}
                  </Label>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {coverage}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {alert
                    ? `${t("jars.overview.spent")}: ${formatVndCompact(alert.spent, householdLocale)} / ${formatVndCompact(alert.limit, householdLocale)}${alert.usagePercent !== null ? ` (${alert.usagePercent.toFixed(1)}%)` : ""}`
                    : t("jars.overview.no_alerts")}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <JarEntryDialog
                  jarId={jar.id}
                  jarName={jar.name}
                  month={month}
                  language={language}
                />
                <JarTargetDialog
                  jarId={jar.id}
                  jarName={jar.name}
                  month={month}
                  defaultMode={target?.target_mode ?? "fixed"}
                  defaultValue={Number(target?.target_value ?? 0)}
                  language={language}
                />
                <Button variant="outline" size="sm" asChild className="rounded-xl">
                  <Link href={`/jars/${jar.id}/history`}>
                    {t("jars.action.view_history")}
                  </Link>
                </Button>
                <JarSettingsDialog
                  jarId={jar.id}
                  jarName={jar.name}
                  defaultName={jar.name}
                  defaultColor={jar.color}
                  defaultIcon={jar.icon}
                  language={language}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
