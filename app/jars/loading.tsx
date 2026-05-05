import { LoadingContainer } from "@/components/ui/loading-container";
import { SkeletonBlock, SkeletonGrid } from "@/components/ui/skeleton-builders";

export default function JarsLoading() {
  return (
    <LoadingContainer>
      <SkeletonBlock height="h-48" rounded="rounded-3xl" />
      <SkeletonGrid cols={4} gap="gap-3" className="grid-cols-2 md:grid-cols-4">
        <SkeletonBlock height="h-24" />
        <SkeletonBlock height="h-24" />
        <SkeletonBlock height="h-24" />
        <SkeletonBlock height="h-24" />
      </SkeletonGrid>
      <SkeletonBlock height="h-64" />
      <SkeletonBlock height="h-56" />
      <SkeletonBlock height="h-72" />
    </LoadingContainer>
  );
}
