import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

import { HouseholdSettingsForm } from "../_components/household-form";
import { SettingsNav } from "../_components/settings-nav";

export default async function SettingsHouseholdPage() {
  const { householdId } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const householdResult = await supabase
    .from("households")
    .select("name, timezone, locale")
    .eq("id", householdId)
    .maybeSingle();

  return (
    <AppShell header={<AppHeader title="Settings · Household" />} footer={<BottomTabBar />}>
      <section className="space-y-4">
        <SettingsNav currentPath="/settings/household" />

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {householdResult.error ? (
            <p className="text-sm text-rose-600">Failed to load household settings: {householdResult.error.message}</p>
          ) : !householdResult.data ? (
            <p className="text-sm text-slate-600">No household settings found yet.</p>
          ) : (
            <HouseholdSettingsForm
              defaultName={householdResult.data.name}
              defaultTimezone={householdResult.data.timezone}
              defaultLocale={householdResult.data.locale}
            />
          )}
        </article>
      </section>
    </AppShell>
  );
}
