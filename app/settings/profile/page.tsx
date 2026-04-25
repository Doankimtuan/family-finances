import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

import { ProfileForm } from "../_components/profile-form";
import { SettingsNav } from "../_components/settings-nav";

export default async function SettingsProfilePage() {
  const { user, language } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const profileResult = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <AppShell
      header={
        <AppHeader
          title={`${t(language, "settings.title")} / ${t(language, "settings.profile")}`}
        />
      }
      footer={<BottomTabBar />}
    >
      <section className="space-y-4">
        <SettingsNav currentPath="/settings/profile" />

        <Card>
          <CardHeader>
            <SectionHeader
              label={language === "vi" ? "Tài khoản" : "Account"}
              title={language === "vi" ? "Hồ sơ cá nhân" : "Personal Profile"}
              description={
                language === "vi"
                  ? "Cập nhật tên hiển thị của bạn trong hộ gia đình."
                  : "Update your display name across the household."
              }
            />
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {profileResult.error ? (
              <p className="text-sm text-destructive">
                {language === "vi"
                  ? "Không thể tải hồ sơ:"
                  : "Failed to load profile:"}{" "}
                {profileResult.error.message}
              </p>
            ) : !profileResult.data ? (
              <p className="text-sm text-muted-foreground">
                {language === "vi"
                  ? "Hồ sơ chưa được khởi tạo. Hãy đăng xuất rồi đăng nhập lại để đồng bộ hồ sơ."
                  : "Profile is not initialized yet. Sign out and sign in again to rehydrate your profile."}
              </p>
            ) : (
              <ProfileForm
                defaultFullName={profileResult.data.full_name}
                defaultEmail={profileResult.data.email}
              />
            )}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
