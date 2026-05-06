import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { SkeletonBlock } from "@/components/ui/skeleton-builders";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";

export default async function SettingsLoadingPage() {
  const { language } = await getAuthenticatedHouseholdContext();

  return (
    <AppShell
      header={<AppHeader title={t(language, "settings.title")} />}
    >
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <SkeletonBlock height="200px" />
        <SkeletonBlock height="150px" />
        <SkeletonBlock height="150px" />
        <SkeletonBlock height="150px" />
        <SkeletonBlock height="150px" />
        <SkeletonBlock height="150px" />
      </div>
    </AppShell>
  );
}
