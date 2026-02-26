import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

import { DecisionToolsClient } from "./_components/decision-tools-client";

export const metadata = {
  title: "Decision Tools | Family Finances",
};

export default async function DecisionToolsPage() {
  const { householdId } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const scenariosResult = await supabase
    .from("scenarios")
    .select("id, scenario_type, name, created_at")
    .eq("household_id", householdId)
    .eq("status", "saved")
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <AppShell header={<AppHeader title="Decision Tools" />} footer={<BottomTabBar />}>
      <div className="space-y-4 pb-20 sm:pb-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">What-if modeling workspace</h1>
          <p className="mt-1 text-sm text-slate-600">
            Compare scenarios before major money decisions. Every chart is designed to support one concrete action.
          </p>
        </article>

        {scenariosResult.error ? (
          <article className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-rose-700">Could not load saved scenarios: {scenariosResult.error.message}</p>
          </article>
        ) : (
          <DecisionToolsClient savedScenarios={scenariosResult.data ?? []} />
        )}
      </div>
    </AppShell>
  );
}
