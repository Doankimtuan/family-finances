import { LoadingContainer } from "@/components/ui/loading-container";
import { SkeletonBlock, SkeletonGrid } from "@/components/ui/skeleton-builders";

export default function DashboardLoading() {
  return (
    <LoadingContainer>
      <SkeletonGrid cols={3} gap="gap-3" className="sm:grid-cols-3 grid-cols-1">
        <SkeletonBlock height="h-28" />
        <SkeletonBlock height="h-28" />
        <SkeletonBlock height="h-28" />
      </SkeletonGrid>
      <SkeletonBlock height="h-80" />
      <SkeletonBlock height="h-32" />
      <SkeletonBlock height="h-64" />
      <SkeletonGrid cols={2} gap="gap-2">
        <SkeletonBlock height="h-11" rounded="rounded-xl" />
        <SkeletonBlock height="h-11" rounded="rounded-xl" />
        <SkeletonBlock height="h-11" rounded="rounded-xl" />
        <SkeletonBlock height="h-11" rounded="rounded-xl" />
      </SkeletonGrid>
    </LoadingContainer>
  );
}
