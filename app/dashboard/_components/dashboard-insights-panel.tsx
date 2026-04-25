"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  Loader2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Target,
  CreditCard,
  Shield,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { useI18n } from "@/lib/providers/i18n-provider";
import { cn } from "@/lib/utils";
import type { InsightRecord } from "@/lib/insights/engine";

type AiInsightRow = {
  id: string;
  function_type: string;
  content_text: string;
  content_json: Record<string, unknown>;
  recommendation_text: string;
  confidence_label: string | null;
  generated_at: string;
};

type InsightsApiResponse = {
  insights: InsightRecord[];
  aiInsights: AiInsightRow[];
  aiUsage: { used: number; cap: number };
};

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    iconColor: "text-destructive",
    badge: "bg-destructive/15 text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-warning/10",
    border: "border-warning/30",
    iconColor: "text-warning",
    badge: "bg-warning/15 text-warning",
  },
  info: {
    icon: CheckCircle2,
    bg: "bg-success/10",
    border: "border-success/30",
    iconColor: "text-success",
    badge: "bg-success/15 text-success",
  },
} as const;

const INSIGHT_ICON_MAP: Record<string, typeof Target> = {
  spending_anomaly: CreditCard,
  goal_risk: Target,
  debt_alert: AlertTriangle,
  savings_milestone: Shield,
  net_worth_change: TrendingUp,
};

export function DashboardInsightsPanel() {
  const { language } = useI18n();
  const vi = language === "vi";

  const {
    data,
    isLoading: loading,
    refetch: fetchInsights,
  } = useQuery<InsightsApiResponse>({
    queryKey: ["dashboard-insights"],
    queryFn: async () => {
      const res = await fetch("/api/insights/check");
      if (!res.ok) throw new Error("Failed to fetch insights");
      return res.json();
    },
    staleTime: 60000,
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<Record<string, number>>({});

  const handleAiAnalysis = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiResult(null);

    try {
      const res = await fetch("/api/ai-insights/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ functionType: "monthly_review" }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setAiResult(
          err?.error ??
            (vi ? "Không thể phân tích. Thử lại sau." : "Analysis failed."),
        );
        return;
      }

      // Refresh insights to show AI result
      await fetchInsights();
      setAiResult(vi ? "✅ Phân tích hoàn tất!" : "✅ Analysis complete!");
    } catch {
      setAiResult(vi ? "Lỗi kết nối." : "Connection error.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleFeedback = async (insightId: string, value: number) => {
    setFeedbackSent((prev) => ({ ...prev, [insightId]: value }));
    try {
      await fetch("/api/ai-insights/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId, feedbackValue: value }),
      });
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-4 w-32 rounded bg-muted mb-4" />
          <div className="space-y-3">
            <div className="h-16 rounded-xl bg-muted" />
            <div className="h-16 rounded-xl bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const insights = data?.insights ?? [];
  const aiInsights = data?.aiInsights ?? [];
  const aiUsage = data?.aiUsage ?? { used: 0, cap: 6 };
  const hasAnyContent = insights.length > 0 || aiInsights.length > 0;

  if (!hasAnyContent && !aiResult) {
    return (
      <Card className="border-success/30 bg-success/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/15">
              <CheckCircle2 className="h-4.5 w-4.5 text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-success">
                {vi
                  ? "Mọi thứ ổn! Không có gợi ý nào."
                  : "All clear! No insights right now."}
              </p>
              <p className="mt-0.5 text-xs text-success/70">
                {vi
                  ? "Tài chính gia đình đang ổn định."
                  : "Your household finances look stable."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <SectionHeader
          icon={Lightbulb}
          label={vi ? "Phân tích" : "Analysis"}
          title={vi ? "Gợi ý tài chính" : "Financial Insights"}
        />
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* ── Deterministic Insights ─────────────────────────── */}
        {insights.map((insight, i) => {
          const severity =
            SEVERITY_CONFIG[insight.severity] ?? SEVERITY_CONFIG.info;
          const InsightIcon = INSIGHT_ICON_MAP[insight.insightType] ?? Info;

          return (
            <div
              key={`insight-${i}`}
              className={cn(
                "rounded-xl border p-3.5 transition-all duration-300",
                severity.bg,
                severity.border,
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    severity.bg,
                  )}
                >
                  <InsightIcon className={cn("h-4 w-4", severity.iconColor)} />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground leading-tight">
                      {insight.title}
                    </p>
                    <Badge
                      className={cn(
                        "shrink-0 text-[9px] uppercase font-black px-1.5 py-0 border-0",
                        severity.badge,
                      )}
                    >
                      {insight.severity === "critical"
                        ? vi
                          ? "Quan trọng"
                          : "Critical"
                        : insight.severity === "warning"
                          ? vi
                            ? "Chú ý"
                            : "Warning"
                          : vi
                            ? "Tốt"
                            : "Good"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.body}
                  </p>
                  {insight.actionTarget && (
                    <Link
                      href={insight.actionTarget}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline mt-1"
                    >
                      {insight.actionLabel ??
                        (vi ? "Xem chi tiết" : "View details")}
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* ── AI Insights ─────────────────────────────────── */}
        {aiInsights.map((ai) => {
          const fb = feedbackSent[ai.id];
          return (
            <div
              key={ai.id}
              className="rounded-xl border border-accent/30 bg-accent/10 p-3.5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground leading-tight">
                      {(ai.content_json as { title?: string })?.title ??
                        (vi ? "Phân tích AI" : "AI Analysis")}
                    </p>
                    <Badge className="shrink-0 text-[9px] uppercase font-black px-1.5 py-0 border-0 bg-accent/15 text-accent">
                      AI
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                    {ai.content_text}
                  </p>
                  {ai.recommendation_text && (
                    <div className="mt-2 rounded-lg bg-accent/10 p-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-0.5">
                        {vi ? "💡 Hành động đề xuất" : "💡 Recommended action"}
                      </p>
                      <p className="text-xs font-medium text-foreground">
                        {ai.recommendation_text}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleFeedback(ai.id, 1)}
                      disabled={fb !== undefined}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-all",
                        fb === 1
                          ? "bg-success/15 text-success"
                          : "text-muted-foreground hover:bg-success/10 hover:text-success",
                      )}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      {vi ? "Hữu ích" : "Helpful"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback(ai.id, -1)}
                      disabled={fb !== undefined}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-all",
                        fb === -1
                          ? "bg-destructive/15 text-destructive"
                          : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                      )}
                    >
                      <ThumbsDown className="h-3 w-3" />
                      {vi ? "Chưa tốt" : "Not helpful"}
                    </button>
                    <span className="ml-auto text-[9px] text-muted-foreground/50">
                      {new Date(ai.generated_at).toLocaleDateString(
                        vi ? "vi-VN" : "en-US",
                        { day: "2-digit", month: "short" },
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* ── AI Action Result ───────────────────────────── */}
        {aiResult && (
          <div className="rounded-lg bg-muted/50 p-3 text-center text-xs text-muted-foreground">
            {aiResult}
          </div>
        )}

        {/* ── AI On-Demand Button ────────────────────────── */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground">
              {vi
                ? `AI đã dùng: ${aiUsage.used}/${aiUsage.cap} lượt tháng này`
                : `AI used: ${aiUsage.used}/${aiUsage.cap} this month`}
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: aiUsage.cap }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 w-3 rounded-full transition-all",
                    i < aiUsage.used ? "bg-accent" : "bg-muted",
                  )}
                />
              ))}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 rounded-xl border-accent/30 text-accent hover:bg-accent/10 hover:border-accent/50"
            onClick={handleAiAnalysis}
            disabled={aiLoading || aiUsage.used >= aiUsage.cap}
          >
            {aiLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {vi ? "Đang phân tích..." : "Analyzing..."}
              </>
            ) : aiUsage.used >= aiUsage.cap ? (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                {vi ? "Đã hết lượt AI tháng này" : "AI cap reached"}
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                {vi ? "Phân tích chi tiết bằng AI" : "Analyze with AI"}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
