import { LoadingContainer } from "@/components/ui/loading-container";
import { SkeletonLine, SkeletonBlock } from "@/components/ui/skeleton-builders";

export default function AssetsLoading() {
  return (
    <LoadingContainer>
      <SkeletonLine width="w-48" />
      <SkeletonBlock height="h-44" />
      <SkeletonBlock height="h-44" />
    </LoadingContainer>
  );
}
