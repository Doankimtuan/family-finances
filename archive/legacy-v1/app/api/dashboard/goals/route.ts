import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import { getHouseholdId, toErrorMessage } from "../_shared";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let householdId: string | null = null;
    try {
      householdId = await getHouseholdId(supabase, user.id);
    } catch {
      // User has no household, return empty data
      const payload = {
        goals: [],
        totalGoals: 0,
        completedGoals: 0,
      };
      const response = NextResponse.json(payload, { status: 200 });
      response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
      return response;
    }

    const [goalsResult, contributionsResult] = await Promise.all([
      supabase
        .from("goals")
        .select("id, name, target_amount, status, target_date")
        .eq("household_id", householdId)
        .eq("status", "active")
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("goal_contributions")
        .select("goal_id, amount, flow_type")
        .eq("household_id", householdId),
    ]);

    if (goalsResult.error || contributionsResult.error) {
      return NextResponse.json(
        {
          error:
            goalsResult.error?.message ??
            contributionsResult.error?.message ??
            "Failed to load goals data.",
        },
        { status: 500 },
      );
    }

    const goalsRaw = (goalsResult.data ?? []) as Array<{
      id: string;
      name: string;
      target_amount: number;
      target_date: string | null;
      status: string;
    }>;
    const contributionsTyped = (contributionsResult.data ?? []) as Array<{
      goal_id: string;
      amount: number;
      flow_type: "inflow" | "outflow";
    }>;

    const goals = goalsRaw.map((goal) => {
      const currentAmount = contributionsTyped
        .filter((c) => c.goal_id === goal.id)
        .reduce(
          (sum: number, c) =>
            sum +
            (c.flow_type === "inflow" ? Number(c.amount) : -Number(c.amount)),
          0,
        );
      return {
        id: goal.id,
        name: goal.name,
        current_amount: currentAmount,
        target_amount: Number(goal.target_amount),
        target_date: goal.target_date,
        status: goal.status,
        progress_percent:
          Number(goal.target_amount) > 0
            ? Math.round((currentAmount / Number(goal.target_amount)) * 100)
            : 0,
      };
    });

    const payload = {
      goals,
      totalGoals: goals.length,
      completedGoals: goals.filter((g) => g.status === "completed").length,
    };

    const response = NextResponse.json(payload, { status: 200 });
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: toErrorMessage(error, "Unexpected server error") },
      { status: 500 },
    );
  }
}
