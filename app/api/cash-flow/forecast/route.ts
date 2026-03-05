import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Feature disabled: cashflow forecast" },
    { status: 404 },
  );
}
