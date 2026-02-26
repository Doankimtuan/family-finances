import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
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
  const { householdId } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  await calculateAndPersistInsights(supabase, householdId, new Date().toISOString().slice(0, 10));

  const insightsResult = await supabase
    .from("insights")
    .select("id, insight_type, severity, title, body, action_label, action_target, generated_at")
    .eq("household_id", householdId)
    .eq("is_dismissed", false)
    .order("generated_at", { ascending: false })
    .limit(20);

  const insights = insightsResult.data ?? [];

  return (
    <AppShell header={<AppHeader title="Insights" />} footer={<BottomTabBar />}>
      <div className="space-y-4 pb-20 sm:pb-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">
            Action-oriented alerts generated from your latest household data.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Current Alerts</h2>

          {insightsResult.error ? (
            <p className="mt-2 text-sm text-rose-600">{insightsResult.error.message}</p>
          ) : insights.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-800">No urgent insights right now.</p>
              <p className="mt-1 text-sm text-slate-600">Keep logging transactions and contributions to receive sharper recommendations.</p>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {insights.map((insight) => (
                <li key={insight.id} className={`rounded-xl border p-4 ${severityStyle[insight.severity] ?? "border-slate-200 bg-slate-50 text-slate-900"}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em]">{insight.insight_type.replace(/_/g, " ")} · {insight.severity}</p>
                  <p className="mt-1 text-sm font-semibold">{insight.title}</p>
                  <p className="mt-1 text-sm">{insight.body}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-xs opacity-75">{new Date(insight.generated_at).toLocaleString("en-US")}</p>
                    {insight.action_target ? (
                      <Link href={insight.action_target} className="rounded-lg border border-current px-3 py-1.5 text-xs font-semibold">
                        {insight.action_label ?? "Open"}
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
