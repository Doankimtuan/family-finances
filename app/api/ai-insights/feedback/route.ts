import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type FeedbackRequest = {
  insightId: string;
  helpful: boolean;
  note?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<FeedbackRequest>;
    const insightId = String(payload.insightId ?? "").trim();

    if (!insightId) {
      return NextResponse.json({ error: "Missing insightId" }, { status: 400 });
    }

    if (typeof payload.helpful !== "boolean") {
      return NextResponse.json({ error: "helpful must be boolean" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const insightResult = await supabase
      .from("ai_insights")
      .select("id, household_id, function_type, prompt_version_id")
      .eq("id", insightId)
      .maybeSingle();

    if (insightResult.error || !insightResult.data) {
      return NextResponse.json(
        { error: insightResult.error?.message ?? "Insight not found" },
        { status: 404 },
      );
    }

    const upsert = await supabase.from("ai_insight_feedback").upsert(
      {
        insight_id: insightResult.data.id,
        household_id: insightResult.data.household_id,
        user_id: user.id,
        function_type: insightResult.data.function_type,
        prompt_version_id: insightResult.data.prompt_version_id,
        feedback_value: payload.helpful ? 1 : -1,
        feedback_note: payload.note?.trim() ? payload.note.trim() : null,
      },
      { onConflict: "insight_id,user_id" },
    );

    if (upsert.error) {
      return NextResponse.json({ error: upsert.error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 },
    );
  }
}
