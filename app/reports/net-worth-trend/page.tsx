import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { getDashboardTrend } from "@/lib/dashboard/trend";
import { formatVnd, formatVndCompact } from "@/lib/dashboard/format";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

import { NetWorthTrendChart } from "../_components/net-worth-trend-chart";

export const metadata = {
  title: "Net Worth Trend | Reports",
};

export default async function NetWorthTrendPage() {
  const { householdId } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const trend = await getDashboardTrend(supabase, householdId, {
    months: 18,
    asOfDate: new Date().toISOString().slice(0, 10),
  });
  const latest = trend.at(-1);
  const prev = trend.length > 1 ? trend.at(-2) : null;
  const delta =
    latest && prev ? Number(latest.net_worth) - Number(prev.net_worth) : 0;

  return (
    <AppShell
      header={<AppHeader title="Net Worth Trend" showBack />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-4 pb-20 sm:pb-6">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Trend Summary
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {latest ? formatVndCompact(Number(latest.net_worth)) : "-"}
            </p>
            <p
              className={`mt-1 text-sm ${delta >= 0 ? "text-success" : "text-destructive"}`}
            >
              {delta >= 0 ? "+" : ""}
              {formatVnd(delta)} vs last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <NetWorthTrendChart points={trend} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
