import {
  MARKET_CATALOG_SYNC_SECRET_ENV,
  syncMarketCatalog,
} from "@/modules/investments/application";
import { hasAdminSyncSecret } from "@/modules/platform/application/admin-sync-auth";

export async function POST(request: Request): Promise<Response> {
  if (!hasAdminSyncSecret(request, MARKET_CATALOG_SYNC_SECRET_ENV)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return Response.json(await syncMarketCatalog());
  } catch (error) {
    console.error({ operation: "marketCatalogSync", error });
    return Response.json(
      { error: "Market catalog sync failed" },
      { status: 500 },
    );
  }
}
