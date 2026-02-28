import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type ReadRequest = {
  insightId: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<ReadRequest>;
    const insightId = String(payload.insightId ?? "").trim();

    if (!insightId) {
      return NextResponse.json({ error: "Missing insightId" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const update = await supabase
      .from("ai_insight_deliveries")
      .update({
        delivery_status: "read",
        read_at: new Date().toISOString(),
      })
      .eq("insight_id", insightId)
      .eq("recipient_user_id", user.id)
      .eq("channel", "in_app");

    if (update.error) {
      return NextResponse.json({ error: update.error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 },
    );
  }
}
