import {
  MARKET_PRICE_SYNC_SECRET_ENV,
  MarketPriceSyncInputSchema,
  syncMarketPrices,
} from "@/modules/investments/application";
import { hasAdminSyncSecret } from "@/modules/platform/application/admin-sync-auth";

export async function POST(request: Request): Promise<Response> {
  if (!hasAdminSyncSecret(request, MARKET_PRICE_SYNC_SECRET_ENV)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    let body: unknown = {};
    try {
      body = await request.json();
    } catch (error) {
      console.error({
        operation: "marketPriceSync",
        phase: "parse_input",
        error,
      });
      return Response.json(
        { error: "Invalid market price sync input" },
        { status: 400 },
      );
    }
    const input = MarketPriceSyncInputSchema.safeParse(body);
    if (!input.success) {
      return Response.json(
        { error: "Invalid market price sync input" },
        { status: 400 },
      );
    }
    return Response.json(await syncMarketPrices(input.data));
  } catch (error) {
    console.error({ operation: "marketPriceSync", error });
    return Response.json(
      { error: "Market price sync failed" },
      { status: 500 },
    );
  }
}
