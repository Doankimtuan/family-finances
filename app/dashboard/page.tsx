import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Settings } from "lucide-react";
import Link from "next/link";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

import { DashboardCorePanel } from "./_components/dashboard-core-panel";
import { DashboardInsightsPanel } from "./_components/dashboard-insights-panel";

export const metadata = {
  title: "Dashboard | Family Finances",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { language } = await getAuthenticatedHouseholdContext();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const householdMembership = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!householdMembership.data?.household_id) {
    redirect("/household");
  }

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
      <DashboardInsightsPanel />
      <div className="h-[10px]" />
      <DashboardCorePanel />
    </AppShell>
  );
}
