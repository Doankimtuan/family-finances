import { NextResponse } from "next/server";

import { buildSavingsListItems, buildSavingsSummary, fetchSavingsBundle } from "@/lib/savings/service";
import { getSavingsApiContext } from "@/lib/savings/server";

export async function GET() {
  try {
    const { supabase, householdId } = await getSavingsApiContext();
    const bundle = await fetchSavingsBundle(supabase, householdId);
    const items = buildSavingsListItems(
      bundle.accounts,
      bundle.withdrawals,
      bundle.goals,
      new Date().toISOString().slice(0, 10),
    );
    return NextResponse.json(buildSavingsSummary(items));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load savings summary." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
