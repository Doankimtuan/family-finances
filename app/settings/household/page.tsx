import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent } from "@/components/ui/card";
import { localeToLanguage, normalizeHouseholdLocale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

import { HouseholdSettingsForm } from "../_components/household-form";
import { SettingsNav } from "../_components/settings-nav";

export default async function SettingsHouseholdPage() {
  const { householdId, language } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const householdResult = await supabase
    .from("households")
    .select("name, timezone, locale")
    .eq("id", householdId)
    .maybeSingle();

  return (
    <AppShell
      header={
        <AppHeader
          title={`${t(language, "settings.title")} · ${t(language, "settings.household")}`}
        />
      }
      footer={<BottomTabBar />}
    >
      <section className="space-y-4">
        <SettingsNav currentPath="/settings/household" />

        <Card>
          <CardContent className="p-5">
            {householdResult.error ? (
              <p className="text-sm text-rose-600">
                Failed to load household settings:{" "}
                {householdResult.error.message}
              </p>
            ) : !householdResult.data ? (
              <p className="text-sm text-slate-600">
                No household settings found yet.
              </p>
            ) : (
              <HouseholdSettingsForm
                defaultName={householdResult.data.name}
                defaultTimezone={householdResult.data.timezone}
                defaultLanguage={localeToLanguage(
                  normalizeHouseholdLocale(householdResult.data.locale),
                )}
              />
            )}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
