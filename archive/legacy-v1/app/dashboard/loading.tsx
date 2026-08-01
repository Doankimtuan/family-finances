import { LoadingContainer } from "@/components/ui/loading-container";
import { SkeletonBlock, SkeletonGrid } from "@/components/ui/skeleton-builders";

export default function DashboardLoading() {
  return (
    <LoadingContainer>
      <SkeletonGrid cols={3} gap="gap-4" className="grid-cols-1 sm:grid-cols-3">
        <SkeletonBlock height="h-32" rounded="rounded-3xl" />
        <SkeletonBlock height="h-32" rounded="rounded-3xl" />
        <SkeletonBlock height="h-32" rounded="rounded-3xl" />
      </SkeletonGrid>
      <SkeletonBlock height="h-24" rounded="rounded-3xl" />
      <SkeletonBlock height="h-40" rounded="rounded-3xl" />
      <SkeletonBlock height="h-72" rounded="rounded-3xl" />
      <SkeletonGrid cols={2} gap="gap-4">
        <SkeletonBlock height="h-12" rounded="rounded-2xl" />
        <SkeletonBlock height="h-12" rounded="rounded-2xl" />
        <SkeletonBlock height="h-12" rounded="rounded-2xl" />
        <SkeletonBlock height="h-12" rounded="rounded-2xl" />
      </SkeletonGrid>
    </LoadingContainer>
  );
}
