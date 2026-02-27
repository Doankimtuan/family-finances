import Link from "next/link";
import {
  Lightbulb,
  AlertTriangle,
  Info,
  Zap,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/dashboard/format";
import { t } from "@/lib/i18n/dictionary";
import { calculateAndPersistInsights } from "@/lib/insights/service";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Insights | Family Finances",
};

export default async function InsightsPage() {
  const { householdId, language, householdLocale } =
    await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
  const supabase = await createClient();

  await calculateAndPersistInsights(
    supabase,
    householdId,
    new Date().toISOString().slice(0, 10),
    { language, locale: householdLocale },
  );

  const insightsResult = await supabase
    .from("insights")
    .select(
      "id, insight_type, severity, title, body, action_label, action_target, generated_at",
    )
    .eq("household_id", householdId)
    .eq("is_dismissed", false)
    .order("generated_at", { ascending: false })
    .limit(20);

  const insights = insightsResult.data ?? [];

  return (
    <AppShell
      header={<AppHeader title={t(language, "insights.title")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <SectionHeader
          label="Intelligence"
          title={vi ? "Phân tích tài chính" : "Financial Intelligence"}
          description={
            vi
              ? "Các cảnh báo có thể hành động được tạo từ dữ liệu hộ gia đình mới nhất."
              : "Action-oriented alerts generated from your latest household data."
          }
          icon={Sparkles}
        />

        <div className="space-y-4">
          <SectionHeader
            label="Current"
            title={vi ? "Cảnh báo hiện tại" : "Current Alerts"}
          />

          {insightsResult.error ? (
            <EmptyState
              icon={AlertTriangle}
              title="Error loading insights"
              description={insightsResult.error.message}
              className="bg-destructive/5 border-destructive/20"
            />
          ) : insights.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title={vi ? "Chưa có cảnh báo" : "No urgent insights"}
              description={
                vi
                  ? "Hãy tiếp tục ghi giao dịch và đóng góp để nhận khuyến nghị sắc nét hơn."
                  : "Keep logging transactions and contributions to receive sharper recommendations."
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {insights.map((insight) => {
                const typeLabel = insight.insight_type.replace(/_/g, " ");
                const severityLabel = insight.severity;
                const isCritical = insight.severity === "critical";
                const isWarning = insight.severity === "warning";

                return (
                  <Card
                    key={insight.id}
                    className="group hover:border-primary/30 transition-all duration-300"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase font-bold bg-muted/20"
                            >
                              {typeLabel}
                            </Badge>
                            <Badge
                              variant={
                                isCritical
                                  ? "destructive"
                                  : isWarning
                                    ? "warning"
                                    : "default"
                              }
                              className="text-[10px] uppercase font-bold"
                            >
                              {severityLabel}
                            </Badge>
                          </div>
                          <h3 className="text-base font-bold text-foreground leading-tight pt-1">
                            {insight.title}
                          </h3>
                        </div>
                        <div
                          className={`p-2 rounded-xl shrink-0 ${isCritical ? "bg-destructive/10 text-destructive" : isWarning ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}
                        >
                          {isCritical ? (
                            <AlertTriangle className="h-5 w-5" />
                          ) : isWarning ? (
                            <Zap className="h-5 w-5" />
                          ) : (
                            <Info className="h-5 w-5" />
                          )}
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                        {insight.body}
                      </p>

                      <div className="mt-5 flex items-center justify-between gap-4 pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                          {formatDateTime(
                            insight.generated_at,
                            householdLocale,
                          )}
                        </p>
                        {insight.action_target && (
                          <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="h-8 font-bold group/btn"
                          >
                            <Link href={insight.action_target}>
                              {insight.action_label ??
                                t(language, "common.open")}
                              <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
