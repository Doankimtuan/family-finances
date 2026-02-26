"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import type { ScenarioActionState } from "./action-types";

function ok(message: string): ScenarioActionState {
  return { status: "success", message };
}

function fail(message: string): ScenarioActionState {
  return { status: "error", message };
}

async function resolveContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, householdId: null, error: "You must be logged in." };
  }

  const membership = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership.error || !membership.data?.household_id) {
    return { supabase, user, householdId: null, error: membership.error?.message ?? "No household found." };
  }

  return { supabase, user, householdId: membership.data.household_id, error: null };
}

export async function saveScenarioAction(
  _prev: ScenarioActionState,
  formData: FormData,
): Promise<ScenarioActionState> {
  const scenarioType = String(formData.get("scenarioType") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const assumptionsRaw = String(formData.get("assumptionsJson") ?? "{}").trim();
  const summaryRaw = String(formData.get("summaryJson") ?? "{}").trim();
  const seriesRaw = String(formData.get("timeseriesJson") ?? "[]").trim();
  const keyMetricsRaw = String(formData.get("keyMetricsJson") ?? "{}").trim();

  if (!scenarioType) return fail("Scenario type is required.");
  if (!name) return fail("Scenario name is required.");

  const allowed = ["loan", "purchase_timing", "savings_projection", "goal_modeling", "debt_vs_invest"];
  if (!allowed.includes(scenarioType)) return fail("Unsupported scenario type.");

  let assumptionsJson: Record<string, unknown>;
  let summaryJson: Record<string, unknown>;
  let timeseriesJson: unknown[];
  let keyMetricsJson: Record<string, unknown>;

  try {
    assumptionsJson = JSON.parse(assumptionsRaw) as Record<string, unknown>;
    summaryJson = JSON.parse(summaryRaw) as Record<string, unknown>;
    timeseriesJson = JSON.parse(seriesRaw) as unknown[];
    keyMetricsJson = JSON.parse(keyMetricsRaw) as Record<string, unknown>;
  } catch {
    return fail("Scenario payload is invalid JSON.");
  }

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

  const scenarioInsert = await supabase
    .from("scenarios")
    .insert({
      household_id: householdId,
      created_by: user.id,
      scenario_type: scenarioType,
      name,
      base_snapshot_date: new Date().toISOString().slice(0, 10),
      assumptions_json: assumptionsJson,
      status: "saved",
    })
    .select("id")
    .single();

  if (scenarioInsert.error || !scenarioInsert.data?.id) {
    return fail(scenarioInsert.error?.message ?? "Failed to save scenario.");
  }

  const resultInsert = await supabase.from("scenario_results").insert({
    scenario_id: scenarioInsert.data.id,
    household_id: householdId,
    summary_json: summaryJson,
    timeseries_json: timeseriesJson,
    key_metrics_json: keyMetricsJson,
  });

  if (resultInsert.error) return fail(resultInsert.error.message);

  revalidatePath("/decision-tools");
  return ok("Scenario saved.");
}
