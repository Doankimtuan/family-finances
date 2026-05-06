import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { t } from "@/lib/i18n/dictionary";
import { getSettingsDataContext } from "@/lib/server/settings-data";
import { User } from "lucide-react";

import { ProfileForm } from "../_components/profile-form";
import { SettingsNav } from "../_components/settings-nav";

export default async function SettingsProfilePage() {
  const { language, profile } = await getSettingsDataContext(true, false, false);

  return (
    <AppShell
      header={
        <AppHeader
          title={`${t(language, "settings.title")} / ${t(language, "settings.profile")}`}
        />
      }
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <SettingsNav currentPath="/settings/profile" />

        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="p-0">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <SectionHeader
                label={t(language, "settings.account")}
                title={t(language, "settings.personal_profile")}
                description={t(language, "settings.profile_description")}
                icon={<User className="h-4 w-4 text-primary" />}
              />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!profile ? (
              <p className="text-sm text-slate-500 italic">
                {t(language, "settings.profile_not_initialized")}
              </p>
            ) : (
              <ProfileForm
                defaultFullName={profile.full_name || ""}
                defaultEmail={profile.email || ""}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
