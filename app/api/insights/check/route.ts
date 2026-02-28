import { NextResponse } from "next/server";

import { calculateAndPersistInsights } from "@/lib/insights/service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const asOfDate =
      searchParams.get("asOfDate") ?? new Date().toISOString().slice(0, 10);

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const householdResult = await supabase
      .from("household_members")
      .select(
        "household_id, household:households!household_id(locale, timezone)",
      )
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (householdResult.error || !householdResult.data?.household_id) {
      return NextResponse.json(
        { error: "No household found." },
        { status: 404 },
      );
    }

    const householdId = householdResult.data.household_id;
    const household = householdResult.data.household as {
      locale?: string | null;
      timezone?: string | null;
    } | null;
    const locale = household?.locale ?? "vi";
    const language = locale.startsWith("en")
      ? ("en" as const)
      : ("vi" as const);

    const insights = await calculateAndPersistInsights(
      supabase,
      householdId,
      asOfDate,
      { language, locale },
    );

    // Also fetch any existing AI insights for this household
    const { data: aiInsights } = await supabase
      .from("ai_insights")
      .select(
        "id, function_type, content_text, content_json, recommendation_text, confidence_label, generated_at",
      )
      .eq("household_id", householdId)
      .order("generated_at", { ascending: false })
      .limit(3);

    // Count AI calls this month for cap display
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const { count: aiCallsThisMonth } = await supabase
      .from("ai_insights")
      .select("id", { count: "exact", head: true })
      .eq("household_id", householdId)
      .gte("generated_at", monthStart.toISOString());

    return NextResponse.json({
      insights,
      aiInsights: aiInsights ?? [],
      aiUsage: {
        used: aiCallsThisMonth ?? 0,
        cap: 6,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate insights",
      },
      { status: 500 },
    );
  }
}
