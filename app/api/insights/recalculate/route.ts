import { NextResponse } from "next/server";

import { isServerFeatureEnabled } from "@/lib/config/features";
import { calculateAndPersistInsights } from "@/lib/insights/service";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (!isServerFeatureEnabled("insights")) {
    return NextResponse.json({ error: "Feature disabled: insights" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "No household found." }, { status: 404 });
  }

  const householdId = membership.data.household_id;
  const asOfDate = new Date().toISOString().slice(0, 10);

  try {
    const insights = await calculateAndPersistInsights(supabase, householdId, asOfDate);
    return NextResponse.json({ ok: true, count: insights.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to recalculate insights.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
