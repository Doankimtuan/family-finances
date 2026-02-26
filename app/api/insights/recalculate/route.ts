import { NextResponse } from "next/server";

import { calculateAndPersistInsights } from "@/lib/insights/service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const asOfDate = searchParams.get("asOfDate") ?? new Date().toISOString().slice(0, 10);

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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
      return NextResponse.json({ error: membership.error?.message ?? "No household found." }, { status: 404 });
    }

    const insights = await calculateAndPersistInsights(supabase, membership.data.household_id, asOfDate);

    return NextResponse.json({ count: insights.length, insights }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 },
    );
  }
}
