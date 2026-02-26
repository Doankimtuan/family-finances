import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { createClient } from "@/lib/supabase/server";

import { DashboardCorePanel } from "./_components/dashboard-core-panel";

export const metadata = {
  title: "Dashboard | Family Finances",
};

export default async function DashboardPage() {
  const supabase = await createClient();
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
      header={<AppHeader title="Core Dashboard" />}
      footer={<BottomTabBar />}
    >
      <DashboardCorePanel />
    </AppShell>
  );
}
