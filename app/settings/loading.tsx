import { AppHeader } from "@/components/layout/app-header";
import { LoadingContainer } from "@/components/ui/loading-container";
import { SkeletonBlock } from "@/components/ui/skeleton-builders";

export default function SettingsLoading() {
  return (
    <LoadingContainer header={<AppHeader title="Settings" />}>
      <SkeletonBlock height="h-12" />
      <SkeletonBlock height="h-40" />
      <SkeletonBlock height="h-64" />
    </LoadingContainer>
  );
}
