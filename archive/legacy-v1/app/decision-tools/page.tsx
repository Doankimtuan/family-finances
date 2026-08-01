import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

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
    .limit(24);

  const scenarioIds = (scenariosResult.data ?? []).map((s) => s.id);
  const resultsResult = scenarioIds.length
    ? await supabase
        .from("scenario_results")
        .select(
          "id, scenario_id, computed_at, summary_json, timeseries_json, key_metrics_json",
        )
        .eq("household_id", householdId)
        .in("scenario_id", scenarioIds)
        .order("computed_at", { ascending: false })
    : { data: [], error: null };

  const latestResultByScenarioId = new Map<
    string,
    {
      computed_at: string;
      summary_json: Record<string, unknown>;
      timeseries_json: unknown[];
      key_metrics_json: Record<string, unknown>;
    }
  >();

  for (const row of resultsResult.data ?? []) {
    if (!latestResultByScenarioId.has(row.scenario_id)) {
      latestResultByScenarioId.set(row.scenario_id, {
        computed_at: row.computed_at,
        summary_json: (row.summary_json ?? {}) as Record<string, unknown>,
        timeseries_json: (row.timeseries_json ?? []) as unknown[],
        key_metrics_json: (row.key_metrics_json ?? {}) as Record<
          string,
          unknown
        >,
      });
    }
  }

  const savedScenariosWithResults = (scenariosResult.data ?? []).map(
    (scenario) => {
      const result = latestResultByScenarioId.get(scenario.id);
      return {
        ...scenario,
        result_computed_at: result?.computed_at ?? null,
        summary_json: result?.summary_json ?? null,
        timeseries_json: result?.timeseries_json ?? null,
        key_metrics_json: result?.key_metrics_json ?? null,
      };
    },
  );

  return (
    <AppShell
      header={<AppHeader title="Decision Tools" />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-4 pb-20 sm:pb-6">
        <Card>
          <CardContent className="p-5">
            <h1 className="text-xl font-semibold text-foreground">
              What-if modeling workspace
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Compare scenarios before major money decisions. Every chart is
              designed to support one concrete action.
            </p>
          </CardContent>
        </Card>

        {scenariosResult.error || resultsResult.error ? (
          <Card className="border-destructive/30">
            <CardContent className="p-5">
              <p className="text-sm text-destructive">
                Could not load saved scenarios:{" "}
                {scenariosResult.error?.message ?? resultsResult.error?.message}
              </p>
            </CardContent>
          </Card>
        ) : (
          <DecisionToolsClient savedScenarios={savedScenariosWithResults} />
        )}
      </div>
    </AppShell>
  );
}
