import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Settings } from "lucide-react";
import Link from "next/link";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";

import { DashboardCorePanel } from "./_components/dashboard-core-panel";

export const metadata = {
  title: "Dashboard | Family Finances",
};

export default async function DashboardPage() {
  const { language } = await getAuthenticatedHouseholdContext();

  return (
    <AppShell
      header={
        <AppHeader
          title={t(language, "dashboard.title")}
          rightAction={
            <Link
              href="/settings"
              className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-6 w-6" />
              <span className="sr-only">Settings</span>
            </Link>
          }
        />
      }
      footer={<BottomTabBar />}
    >
      <DashboardCorePanel />
    </AppShell>
  );
}
