"use client";

import Link from "next/link";
import { Target, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { formatVndCompact } from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import { cn } from "@/lib/utils";

type SnapshotProps = {
  goals: any[];
  jars: any[];
  jarsEnabled: boolean;
};

export function SnapshotsSection({
  goals,
  jars,
  jarsEnabled,
}: SnapshotProps) {
  const { locale, t } = useI18n();

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Target}
        label={t("dashboard.snapshots.label")}
        title={t("dashboard.snapshots.title")}
        description={t("dashboard.snapshots.description")}
      />
      <div
        className={cn(
          "grid gap-4",
          jarsEnabled ? "lg:grid-cols-2" : "lg:grid-cols-1",
        )}
      >
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                {t("dashboard.goals.title")}
              </h2>
              <Link
                href="/goals"
                className="text-sm font-medium text-primary hover:underline"
              >
                {t("dashboard.goals.view_all")}
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {goals && goals.length > 0 ? (
              goals.slice(0, 3).map((goal) => {
                const pct = Math.min(
                  100,
                  Math.round((goal.current_amount / goal.target_amount) * 100),
                );
                return (
                  <div
                    key={goal.id}
                    className="rounded-2xl border border-border/60 bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {goal.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatVndCompact(goal.current_amount, locale)} /{" "}
                          {formatVndCompact(goal.target_amount, locale)}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 rounded-full">
                        {pct}%
                      </Badge>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={Target}
                title={t("dashboard.goals.title")}
                description={t("dashboard.goals.empty")}
              />
            )}
          </CardContent>
        </Card>

        {jarsEnabled ? (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("dashboard.jars.title")}
                </h2>
                <Link
                  href="/jars"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t("dashboard.jars.open")}
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {jars && jars.length > 0 ? (
                jars.slice(0, 3).map((jar) => {
                  const coverage = Math.round(jar.coverage_ratio * 100);
                  return (
                    <div
                      key={jar.jar_id}
                      className="rounded-2xl border border-border/60 bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {jar.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatVndCompact(jar.net_amount, locale)} /{" "}
                            {formatVndCompact(jar.target_amount, locale)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 rounded-full"
                        >
                          {coverage}%
                        </Badge>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            coverage >= 100
                              ? "bg-success"
                              : coverage >= 75
                                ? "bg-warning"
                                : "bg-primary",
                          )}
                          style={{
                            width: `${Math.min(100, Math.max(0, coverage))}%`,
                          }}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {coverage < 100
                            ? t("dashboard.jars.title")
                            : t("dashboard.actions.empty.title")}
                        </span>
                        <Link
                          href="/jars"
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          {t("dashboard.jars.allocate")}
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  icon={Wallet}
                  title={t("dashboard.jars.title")}
                  description={t("dashboard.jars.empty")}
                />
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
