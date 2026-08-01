import { NextResponse } from "next/server";

import { resolveApiHouseholdContext } from "../_lib/context";

type MapCategoryPayload = {
  categoryId?: string;
  jarId?: string;
};

export async function POST(request: Request) {
  const ctx = await resolveApiHouseholdContext();
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const payload = (await request.json().catch(() => null)) as MapCategoryPayload | null;
  const categoryId = payload?.categoryId?.trim();
  const jarId = payload?.jarId?.trim();

  if (!categoryId || !jarId) {
    return NextResponse.json(
      { error: "categoryId and jarId are required" },
      { status: 400 },
    );
  }

  const [categoryResult, jarResult] = await Promise.all([
    ctx.value.supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .or(`household_id.is.null,household_id.eq.${ctx.value.householdId}`)
      .limit(1)
      .maybeSingle(),
    ctx.value.supabase
      .from("jar_definitions")
      .select("id")
      .eq("id", jarId)
      .eq("household_id", ctx.value.householdId)
      .eq("is_archived", false)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle(),
  ]);

  if (!categoryResult.data?.id) {
    return NextResponse.json({ error: "Invalid categoryId" }, { status: 400 });
  }
  if (!jarResult.data?.id) {
    return NextResponse.json({ error: "Invalid jarId" }, { status: 400 });
  }

  const upsert = await ctx.value.supabase
    .from("spending_jar_category_map")
    .upsert(
      {
        household_id: ctx.value.householdId,
        category_id: categoryId,
        jar_id: jarId,
      },
      { onConflict: "household_id,category_id" },
    )
    .select("id, household_id, category_id, jar_id")
    .single();

  if (upsert.error || !upsert.data) {
    return NextResponse.json(
      { error: upsert.error?.message ?? "Failed to save mapping" },
      { status: 500 },
    );
  }

  return NextResponse.json({ row: upsert.data }, { status: 200 });
}
