import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { localeToLanguage, normalizeHouseholdLocale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { Home } from "lucide-react";

import { HouseholdSettingsForm } from "../_components/household-form";
import { SettingsNav } from "../_components/settings-nav";

export default async function SettingsHouseholdPage() {
  const { householdId, language } = await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
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
          title={`${t(language, "settings.title")} / ${t(language, "settings.household")}`}
        />
      }
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <SettingsNav currentPath="/settings/household" />

        <Card className="border-emerald-100 shadow-sm overflow-hidden">
          <CardHeader className="p-0">
            <div className="p-5 border-b border-emerald-50 bg-emerald-50/30">
              <SectionHeader
                label={vi ? "Hộ gia đình" : "Household"}
                title={vi ? "Cài đặt hộ gia đình" : "Household Settings"}
                description={
                  vi
                    ? "Quản lý thông tin chung, ngôn ngữ và múi giờ của gia đình."
                    : "Manage shared identity, language, and timezone settings."
                }
                icon={<Home className="h-4 w-4 text-emerald-600" />}
              />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {householdResult.error ? (
              <p className="text-sm text-rose-600 font-medium">
                {vi
                  ? "Không thể tải cài đặt hộ gia đình:"
                  : "Failed to load household settings:"}{" "}
                {householdResult.error.message}
              </p>
            ) : !householdResult.data ? (
              <p className="text-sm text-slate-500 italic">
                {vi
                  ? "Chưa tìm thấy cài đặt hộ gia đình."
                  : "No household settings found yet."}
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
      </div>
    </AppShell>
  );
}
