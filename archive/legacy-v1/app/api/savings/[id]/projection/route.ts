import { NextResponse } from "next/server";

import { projectionQuerySchema } from "@/lib/savings/schemas";
import { fetchSavingsBundle } from "@/lib/savings/service";
import { computeSavingsProjection } from "@/lib/savings/calculations";
import { getSavingsApiContext } from "@/lib/savings/server";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const searchParams = new URL(request.url).searchParams;
  const parsed = projectionQuerySchema.safeParse({
    asOfDate: searchParams.get("asOfDate") ?? undefined,
    projectionDays: searchParams.get("projectionDays") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { supabase, householdId } = await getSavingsApiContext();
    const bundle = await fetchSavingsBundle(supabase, householdId, { id });
    const account = bundle.accounts[0];
    if (!account) {
      return NextResponse.json({ error: "Savings not found." }, { status: 404 });
    }

    return NextResponse.json(
      computeSavingsProjection(
        account,
        bundle.withdrawals.filter((row) => row.savings_account_id === id),
        parsed.data.asOfDate ?? new Date().toISOString().slice(0, 10),
        parsed.data.projectionDays,
      ),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load projection." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
