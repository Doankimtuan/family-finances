import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * On-demand AI analysis endpoint.
 * Calls the Supabase Edge Function `ai-cycle-dispatch` for a specific function_type.
 * Respects the 6-calls/month cap already built into the Edge Function.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      functionType?: string;
    };

    const functionType = body.functionType ?? "monthly_review";
    const validTypes = [
      "monthly_review",
      "goal_risk_coach",
      "spending_anomaly_explainer",
    ];
    if (!validTypes.includes(functionType)) {
      return NextResponse.json(
        { error: `Invalid functionType. Allowed: ${validTypes.join(", ")}` },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has a household
    const householdResult = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!householdResult.data?.household_id) {
      return NextResponse.json(
        { error: "No household found." },
        { status: 404 },
      );
    }

    // Call the Edge Function
    const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_URL;
    const aiWorkerSecret = process.env.AI_WORKER_SECRET;

    if (!edgeFunctionUrl || !aiWorkerSecret) {
      return NextResponse.json(
        {
          error:
            "AI service not configured. Set SUPABASE_EDGE_FUNCTION_URL and AI_WORKER_SECRET.",
        },
        { status: 503 },
      );
    }

    const edgeResponse = await fetch(`${edgeFunctionUrl}/ai-cycle-dispatch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiWorkerSecret}`,
      },
      body: JSON.stringify({
        functionType,
        triggerSource: "manual",
      }),
    });

    if (!edgeResponse.ok) {
      const errorBody = await edgeResponse.text();
      return NextResponse.json(
        { error: `AI service error: ${errorBody}` },
        { status: edgeResponse.status },
      );
    }

    const result = await edgeResponse.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "AI analysis failed",
      },
      { status: 500 },
    );
  }
}
