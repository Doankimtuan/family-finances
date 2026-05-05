import { LoadingContainer } from "@/components/ui/loading-container";
import { SkeletonLine, SkeletonBlock } from "@/components/ui/skeleton-builders";

export default function CategoriesLoading() {
  return (
    <LoadingContainer variant="full-page">
      <SkeletonLine width="w-44" />
      <SkeletonBlock height="h-56" />
      <SkeletonBlock height="h-48" />
    </LoadingContainer>
  );
}
