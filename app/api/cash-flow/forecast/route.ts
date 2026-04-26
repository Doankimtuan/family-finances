import { NextResponse } from "next/server";

import { isServerFeatureEnabled } from "@/lib/config/features";

export async function GET() {
  if (!isServerFeatureEnabled("cashflowForecast")) {
    return NextResponse.json({ error: "Feature disabled: cashflow forecast" }, { status: 404 });
  }

  return NextResponse.json({ error: "Not implemented." }, { status: 501 });
}
