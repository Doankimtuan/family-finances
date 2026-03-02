import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { calculateAndPersistHealthSnapshot } from "@/lib/health/service";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";
import type { HealthFactorKey } from "@/lib/health/engine";

export const metadata = {
  title: "Financial Health | Family Finances",
};

/** Maps score 0-100 to a status tier */
function getHealthStatus(
  score: number,
): "healthy" | "improving" | "needs_attention" | "building" {
  if (score >= 75) return "healthy";
  if (score >= 55) return "improving";
  if (score >= 35) return "needs_attention";
  return "building";
}

/** Returns colors, emoji, and badge variant for each status */
function getStatusConfig(status: ReturnType<typeof getHealthStatus>) {
  switch (status) {
    case "healthy":
      return {
        color: "text-success",
        bgColor: "bg-success/10",
        ringColor: "stroke-success",
        emoji: "🟢",
        badgeVariant: "success" as const,
      };
    case "improving":
      return {
        color: "text-primary",
        bgColor: "bg-primary/10",
        ringColor: "stroke-primary",
        emoji: "🟡",
        badgeVariant: "default" as const,
      };
    case "needs_attention":
      return {
        color: "text-warning",
        bgColor: "bg-warning/10",
        ringColor: "stroke-warning",
        emoji: "🟠",
        badgeVariant: "warning" as const,
      };
    case "building":
      return {
        color: "text-destructive",
        bgColor: "bg-destructive/10",
        ringColor: "stroke-destructive",
        emoji: "🔴",
        badgeVariant: "destructive" as const,
      };
  }
}

/** Constructive vocabulary map — replaces shaming labels */
const factorStatusText: Record<
  HealthFactorKey,
  (score: number, language: "en" | "vi") => string
> = {
  cashflow: (s, lang) => {
    if (s >= 75) return lang === "vi" ? "Lành mạnh" : "Healthy";
    if (s >= 55) return lang === "vi" ? "Đang cải thiện" : "Building";
    if (s >= 35) return lang === "vi" ? "Cần điều chỉnh" : "Needs a tweak";
    return lang === "vi" ? "Cần hành động" : "Priority area";
  },
  emergency: (s, lang) => {
    if (s >= 70) return lang === "vi" ? "Vững chắc" : "Resilient";
    if (s >= 40) return lang === "vi" ? "Đang xây dựng" : "Building";
    return lang === "vi" ? "Cần ưu tiên" : "Priority area";
  },
  debt: (s, lang) => {
    if (s >= 75) return lang === "vi" ? "Kiểm soát tốt" : "Controlled";
    if (s >= 50) return lang === "vi" ? "Đang quản lý" : "Working through it";
    return lang === "vi" ? "Cần chú ý" : "Needs attention";
  },
  networth: (s, lang) => {
    if (s >= 75) return lang === "vi" ? "Tăng trưởng mạnh" : "Growing strong";
    if (s >= 50) return lang === "vi" ? "Ổn định" : "Steady";
    return lang === "vi" ? "Cần cải thiện" : "Room to grow";
  },
  goals: (s, lang) => {
    if (s >= 75) return lang === "vi" ? "Đúng tiến độ" : "On track";
    if (s >= 50)
      return lang === "vi" ? "Cần điều chỉnh nhỏ" : "Small adjustment";
    return lang === "vi" ? "Cần điều chỉnh" : "Needs adjustment";
  },
  diversification: (s, lang) => {
    if (s >= 70) return lang === "vi" ? "Đa dạng tốt" : "Well diversified";
    if (s >= 40) return lang === "vi" ? "Đang mở rộng" : "Room to diversify";
    return lang === "vi" ? "Đang tập trung" : "Concentrated";
  },
};

const FACTOR_KEYS: HealthFactorKey[] = [
  "cashflow",
  "emergency",
  "debt",
  "networth",
  "goals",
  "diversification",
];

export default async function HealthPage() {
  const { householdId, language } = await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
  const supabase = await createClient();

  const health = await calculateAndPersistHealthSnapshot(
    supabase,
    householdId,
    new Date().toISOString().slice(0, 10),
  );

  const score = Math.round(health.overallScore);
  const status = getHealthStatus(score);
  const config = getStatusConfig(status);

  // Find strongest and weakest factors
  const factorEntries = FACTOR_KEYS.map((key) => ({
    key,
    score: Math.round(health.factorScores[key]),
  }));
  const strongest = factorEntries.reduce((a, b) =>
    a.score >= b.score ? a : b,
  );
  const weakest = factorEntries.reduce((a, b) => (a.score <= b.score ? a : b));

  // SVG ring parameters
  const RADIUS = 52;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const dashOffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  // Get action text from i18n
  const actionText = t(
    language,
    health.topAction?.startsWith("health.action.")
      ? health.topAction
      : "health.action.no_data",
  );

  return (
    <AppShell
      header={<AppHeader title={t(language, "health.score_label")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-5 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* HERO — Status Word + Ring */}
        <Card
          className={cn("border-transparent overflow-hidden", config.bgColor)}
        >
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center gap-4">
              {/* SVG Ring */}
              <div className="relative h-36 w-36">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
                  {/* Background ring */}
                  <circle
                    cx="64"
                    cy="64"
                    r={RADIUS}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-muted/30"
                  />
                  {/* Score ring */}
                  <circle
                    cx="64"
                    cy="64"
                    r={RADIUS}
                    fill="none"
                    strokeWidth="10"
                    className={config.ringColor}
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    style={{ transition: "stroke-dashoffset 1.2s ease" }}
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={cn(
                      "text-3xl font-black leading-none",
                      config.color,
                    )}
                  >
                    {score}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                    /100
                  </span>
                </div>
              </div>

              {/* Status word */}
              <div className="text-center">
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-2xl font-black text-foreground">
                    {t(language, `health.status.${status}`)}
                  </span>
                  <Badge
                    variant={config.badgeVariant}
                    className="text-[10px] font-bold uppercase"
                  >
                    {config.emoji}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(language, "health.score_label")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TOP ACTION — Most impactful thing to do */}
        <Card className="border-primary/20 bg-primary/5 ring-1 ring-primary/10">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                {vi
                  ? "Hành động ưu tiên tháng này"
                  : "Priority action this month"}
              </p>
              <p className="text-sm font-semibold text-foreground leading-relaxed">
                {actionText}
              </p>
              <Link
                href="/transactions"
                className="mt-2 inline-flex items-center text-xs font-bold text-primary hover:underline underline-offset-4"
              >
                {vi ? "Xem giao dịch" : "Review transactions"}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* STRONGEST AREA */}
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/20">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-success mb-1">
                  {t(language, "health.strongest")}
                </p>
                <p className="text-base font-bold text-foreground">
                  {t(language, `health.factor.${strongest.key}`)}
                  <span className="ml-2 text-sm font-medium text-success">
                    —{" "}
                    {factorStatusText[strongest.key](strongest.score, language)}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {t(language, `health.factor.${strongest.key}.desc`)}
                </p>
                <Progress
                  value={strongest.score}
                  variant="success"
                  className="mt-3 h-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WEAKEST AREA — with action */}
        <Card
          className={cn(
            "border",
            weakest.score < 40
              ? "border-destructive/30 bg-destructive/5"
              : "border-warning/30 bg-warning/5",
          )}
        >
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  weakest.score < 40 ? "bg-destructive/20" : "bg-warning/20",
                )}
              >
                <AlertCircle
                  className={cn(
                    "h-5 w-5",
                    weakest.score < 40 ? "text-destructive" : "text-warning",
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest mb-1",
                    weakest.score < 40 ? "text-destructive" : "text-warning",
                  )}
                >
                  {t(language, "health.improve")}
                </p>
                <p className="text-base font-bold text-foreground">
                  {t(language, `health.factor.${weakest.key}`)}
                  <span
                    className={cn(
                      "ml-2 text-sm font-medium",
                      weakest.score < 40 ? "text-destructive" : "text-warning",
                    )}
                  >
                    — {factorStatusText[weakest.key](weakest.score, language)}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {t(language, `health.factor.${weakest.key}.desc`)}
                </p>
                <Progress
                  value={weakest.score}
                  variant={weakest.score < 40 ? "destructive" : "warning"}
                  className="mt-3 h-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ALL 6 FACTORS — collapsible */}
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-foreground">
                {t(language, "health.see_all")}
              </span>
              <Badge variant="secondary" className="text-[10px] font-bold">
                {score}/100
              </Badge>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {factorEntries.map(({ key, score: factorScore }) => {
              const isStrong = factorScore >= 70;
              const isMed = factorScore >= 45;
              const statusText = factorStatusText[key](factorScore, language);
              return (
                <div
                  key={key}
                  className="rounded-xl border border-border bg-card p-4 flex items-center gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-foreground">
                        {t(language, `health.factor.${key}`)}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {isStrong ? (
                          <TrendingUp className="h-3.5 w-3.5 text-success" />
                        ) : isMed ? (
                          <Minus className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <span
                          className={cn(
                            "text-xs font-bold",
                            isStrong
                              ? "text-success"
                              : isMed
                                ? "text-primary"
                                : "text-destructive",
                          )}
                        >
                          {statusText}
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={factorScore}
                      variant={
                        isStrong ? "success" : isMed ? "default" : "destructive"
                      }
                      className="h-1.5"
                    />
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      {t(language, `health.factor.${key}.desc`)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={cn(
                        "text-xl font-black leading-none",
                        isStrong
                          ? "text-success"
                          : isMed
                            ? "text-foreground"
                            : "text-destructive",
                      )}
                    >
                      {factorScore}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </details>

        {/* Quick navigation */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            asChild
            variant="outline"
            className="h-auto flex-col gap-1 py-4 rounded-2xl"
          >
            <Link href="/jars">
              <span className="text-xs font-bold">
                {vi ? "Xem hũ tài chính" : "View Jars"}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto flex-col gap-1 py-4 rounded-2xl"
          >
            <Link href="/reports">
              <span className="text-xs font-bold">
                {vi ? "Báo cáo tháng" : "Monthly Report"}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
