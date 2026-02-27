"use client";

import Link from "next/link";
import {
  Zap,
  Info,
  Star,
  ArrowRight,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type Insight = {
  id: string;
  insight_type: string;
  severity: string;
  title: string;
  body: string;
  action_label: string | null;
  action_target: string | null;
  generated_at: string;
};

type InsightGroup = {
  key: string;
  label: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  insights: Insight[];
  emptyText: string;
};

type Props = {
  insights: Insight[];
  language: "en" | "vi";
};

/** Win types are positive/celebratory insight types */
const WIN_TYPES = ["savings_milestone", "net_worth_change"];
const WIN_POSITIVE_SEVERITY = "info";

function isWin(insight: Insight): boolean {
  return (
    WIN_TYPES.includes(insight.insight_type) &&
    insight.severity === WIN_POSITIVE_SEVERITY
  );
}

function isActionRequired(insight: Insight): boolean {
  return insight.severity === "critical";
}

export function InsightsGrouped({ insights, language }: Props) {
  const vi = language === "vi";

  const critical = insights.filter(isActionRequired);
  const wins = insights.filter(isWin);
  const worthKnowing = insights.filter(
    (i) => !isActionRequired(i) && !isWin(i),
  );

  const groups: InsightGroup[] = [
    {
      key: "critical",
      label: vi ? "Cần hành động" : "Action Required",
      icon: AlertTriangle,
      colorClass: "text-destructive",
      bgClass: "bg-destructive/10",
      borderClass: "border-destructive/30",
      insights: critical,
      emptyText: vi
        ? "Không có hành động khẩn cấp ngay bây giờ."
        : "No urgent actions right now.",
    },
    {
      key: "warning",
      label: vi ? "Đáng lưu ý" : "Worth Knowing",
      icon: Info,
      colorClass: "text-warning",
      bgClass: "bg-warning/10",
      borderClass: "border-warning/30",
      insights: worthKnowing,
      emptyText: vi
        ? "Không có gợi ý nào về lúc này."
        : "No alerts at the moment.",
    },
    {
      key: "wins",
      label: vi ? "Thành tích" : "Wins",
      icon: Trophy,
      colorClass: "text-success",
      bgClass: "bg-success/10",
      borderClass: "border-success/30",
      insights: wins,
      emptyText: vi
        ? "Tiếp tục ghi dữ liệu để mở khóa các thành tích."
        : "Keep logging to unlock milestone wins.",
    },
  ];

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          {/* Group header */}
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg",
                group.bgClass,
              )}
            >
              <group.icon className={cn("h-4 w-4", group.colorClass)} />
            </div>
            <h2 className="text-sm font-bold text-foreground">{group.label}</h2>
            {group.insights.length > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] font-bold ml-auto"
              >
                {group.insights.length}
              </Badge>
            )}
          </div>

          {/* Cards */}
          {group.insights.length === 0 ? (
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-sm text-muted-foreground",
                group.borderClass,
              )}
            >
              {group.emptyText}
            </div>
          ) : (
            <div className="space-y-3">
              {(group.key === "wins"
                ? group.insights
                : group.insights.slice(0, 3)
              ).map((insight) => {
                const isLargeAlert = group.key === "critical";
                return (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    group={group}
                    isLargeAlert={isLargeAlert}
                    language={language}
                  />
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function InsightCard({
  insight,
  group,
  isLargeAlert,
  language,
}: {
  insight: Insight;
  group: InsightGroup;
  isLargeAlert: boolean;
  language: "en" | "vi";
}) {
  const vi = language === "vi";

  // User-friendly type labels (no underscores, no dev-speak)
  const friendlyTypeMap: Record<string, { en: string; vi: string }> = {
    spending_anomaly: { en: "Spending", vi: "Chi tiêu" },
    goal_risk: { en: "Goal", vi: "Mục tiêu" },
    debt_alert: { en: "Debt", vi: "Nợ" },
    savings_milestone: { en: "Milestone", vi: "Thành tích" },
    net_worth_change: { en: "Net Worth", vi: "Tài sản ròng" },
  };
  const typeLabel = vi
    ? (friendlyTypeMap[insight.insight_type]?.vi ?? insight.insight_type)
    : (friendlyTypeMap[insight.insight_type]?.en ?? insight.insight_type);

  return (
    <Card
      className={cn(
        "group transition-all duration-300",
        isLargeAlert
          ? cn("border", group.borderClass)
          : "hover:border-primary/30",
      )}
    >
      <CardContent
        className={cn(
          "p-5",
          isLargeAlert && cn("rounded-2xl", group.bgClass, "bg-opacity-40"),
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              group.bgClass,
            )}
          >
            {insight.insight_type === "savings_milestone" ? (
              <Star className={cn("h-4.5 w-4.5", group.colorClass)} />
            ) : insight.insight_type === "net_worth_change" ? (
              <TrendingUp className={cn("h-4.5 w-4.5", group.colorClass)} />
            ) : group.key === "critical" ? (
              <AlertTriangle className={cn("h-4.5 w-4.5", group.colorClass)} />
            ) : group.key === "wins" ? (
              <Trophy className={cn("h-4.5 w-4.5", group.colorClass)} />
            ) : (
              <Lightbulb className={cn("h-4.5 w-4.5", group.colorClass)} />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge
                variant="outline"
                className="text-[10px] font-bold uppercase bg-muted/30 border-border/60"
              >
                {typeLabel}
              </Badge>
            </div>
            <h3 className="text-sm font-bold text-foreground leading-snug">
              {insight.title}
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              {insight.body}
            </p>

            {insight.action_target && (
              <div className="mt-3">
                <Button
                  asChild
                  size="sm"
                  variant={group.key === "critical" ? "default" : "secondary"}
                  className="h-8 font-bold group/btn"
                >
                  <Link href={insight.action_target}>
                    {insight.action_label ??
                      (vi ? "Xem chi tiết" : "View details")}
                    <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function InsightsEmpty({ language }: { language: "en" | "vi" }) {
  const vi = language === "vi";
  return (
    <EmptyState
      icon={Zap}
      title={vi ? "Không có gợi ý nào lúc này" : "No urgent insights right now"}
      description={
        vi
          ? "Hãy tiếp tục ghi giao dịch và đóng góp để nhận khuyến nghị sắc nét hơn."
          : "Keep logging transactions and contributions to receive sharper recommendations."
      }
    />
  );
}
