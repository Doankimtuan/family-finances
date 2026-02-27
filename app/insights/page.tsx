import { AlertTriangle, Sparkles, Settings } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { t } from "@/lib/i18n/dictionary";
import { calculateAndPersistInsights } from "@/lib/insights/service";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { InsightsGrouped } from "./_components/insights-grouped";

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
    .limit(30);

  const insights = insightsResult.data ?? [];

  return (
    <AppShell
      header={
        <AppHeader
          title={t(language, "insights.title")}
          rightAction={
            <Link
              href="/settings"
              className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-6 w-6" />
              <span className="sr-only">Settings</span>
            </Link>
          }
        />
      }
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <SectionHeader
          label={vi ? "Phân tích" : "Intelligence"}
          title={vi ? "Phân tích tài chính" : "Financial Intelligence"}
          description={
            vi
              ? "Được tạo tự động từ dữ liệu hộ gia đình mới nhất. Cập nhật mỗi ngày."
              : "Auto-generated from your latest household data. Updated daily."
          }
          icon={Sparkles}
        />

        {insightsResult.error ? (
          <EmptyState
            icon={AlertTriangle}
            title={vi ? "Không thể tải gợi ý" : "Error loading insights"}
            description={insightsResult.error.message}
            className="bg-destructive/5 border-destructive/20"
          />
        ) : (
          <InsightsGrouped insights={insights} language={language} />
        )}
      </div>
    </AppShell>
  );
}
