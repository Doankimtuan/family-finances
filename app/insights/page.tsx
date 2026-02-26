import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { formatDateTime } from "@/lib/dashboard/format";
import { t } from "@/lib/i18n/dictionary";
import { calculateAndPersistInsights } from "@/lib/insights/service";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Insights | Family Finances",
};

const severityStyle: Record<string, string> = {
  info: "border-teal-200 bg-teal-50 text-teal-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  critical: "border-rose-200 bg-rose-50 text-rose-900",
};

export default async function InsightsPage() {
  const { householdId, language, householdLocale } = await getAuthenticatedHouseholdContext();
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
    .select("id, insight_type, severity, title, body, action_label, action_target, generated_at")
    .eq("household_id", householdId)
    .eq("is_dismissed", false)
    .order("generated_at", { ascending: false })
    .limit(20);

  const insights = insightsResult.data ?? [];

  return (
    <AppShell header={<AppHeader title={t(language, "insights.title")} />} footer={<BottomTabBar />}>
      <div className="space-y-4 pb-20 sm:pb-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">
            {vi
              ? "Các cảnh báo có thể hành động được tạo từ dữ liệu hộ gia đình mới nhất."
              : "Action-oriented alerts generated from your latest household data."}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{vi ? "Cảnh báo hiện tại" : "Current Alerts"}</h2>

          {insightsResult.error ? (
            <p className="mt-2 text-sm text-rose-600">{insightsResult.error.message}</p>
          ) : insights.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-800">{vi ? "Hiện chưa có cảnh báo khẩn cấp." : "No urgent insights right now."}</p>
              <p className="mt-1 text-sm text-slate-600">
                {vi
                  ? "Hãy tiếp tục ghi giao dịch và đóng góp để nhận khuyến nghị sắc nét hơn."
                  : "Keep logging transactions and contributions to receive sharper recommendations."}
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {insights.map((insight) => (
                <li key={insight.id} className={`rounded-xl border p-4 ${severityStyle[insight.severity] ?? "border-slate-200 bg-slate-50 text-slate-900"}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                    {(insight.insight_type === "spending_anomaly"
                      ? (vi ? "Bất thường chi tiêu" : "Spending anomaly")
                      : insight.insight_type === "goal_risk"
                        ? (vi ? "Rủi ro mục tiêu" : "Goal risk")
                        : insight.insight_type === "debt_alert"
                          ? (vi ? "Cảnh báo nợ" : "Debt alert")
                          : insight.insight_type === "savings_milestone"
                            ? (vi ? "Mốc tiết kiệm" : "Savings milestone")
                            : insight.insight_type === "net_worth_change"
                              ? (vi ? "Biến động tài sản ròng" : "Net worth change")
                              : insight.insight_type.replace(/_/g, " "))}{" "}
                    ·{" "}
                    {(insight.severity === "critical"
                      ? (vi ? "Nghiêm trọng" : "Critical")
                      : insight.severity === "warning"
                        ? (vi ? "Cảnh báo" : "Warning")
                        : vi ? "Thông tin" : "Info")}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{insight.title}</p>
                  <p className="mt-1 text-sm">{insight.body}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-xs opacity-75">{formatDateTime(insight.generated_at, householdLocale)}</p>
                    {insight.action_target ? (
                      <Link href={insight.action_target} className="rounded-lg border border-current px-3 py-1.5 text-xs font-semibold">
                        {insight.action_label ?? t(language, "common.open")}
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </AppShell>
  );
}
