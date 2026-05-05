import { LoadingContainer } from "@/components/ui/loading-container";
import { SkeletonLine, SkeletonBlock } from "@/components/ui/skeleton-builders";

export default function ActivityLoading() {
  return (
    <LoadingContainer>
      <SkeletonLine width="w-56" />
      <SkeletonBlock height="h-56" className="sm:hidden" />
      <SkeletonBlock height="h-52" />
      <SkeletonBlock height="h-56" />
    </LoadingContainer>
  );
}
