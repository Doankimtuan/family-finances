import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Reports | Family Finances",
};

export default function ReportsPage() {
  return (
    <AppShell header={<AppHeader title="Reports" />} footer={<BottomTabBar />}>
      <div className="space-y-4 pb-20 sm:pb-6">
        <Card>
          <CardContent className="p-5">
            <h1 className="text-xl font-semibold text-foreground">
              Monthly reporting hub
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review trend direction and complete your monthly financial review
              with one source of truth.
            </p>
          </CardContent>
        </Card>

        <nav className="grid grid-cols-1 gap-3">
          <Link href="/reports/net-worth-trend" className="block">
            <Card className="transition hover:border-primary/50">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground">
                  Net Worth Trend
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Track long-term wealth direction month by month.
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/reports/cash-flow-trend" className="block">
            <Card className="transition hover:border-primary/50">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground">
                  Cash-Flow Trend
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Compare income, expenses, and savings trend over time.
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/reports/monthly-review" className="block">
            <Card className="transition hover:border-primary/50">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground">
                  Monthly Review
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Summarize wins, risks, and next month actions.
                </p>
              </CardContent>
            </Card>
          </Link>
        </nav>
      </div>
    </AppShell>
  );
}
