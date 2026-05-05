import { LoadingContainer } from "@/components/ui/loading-container";
import { SkeletonBlock } from "@/components/ui/skeleton-builders";

export default function GoalsLoading() {
  return (
    <LoadingContainer>
      <SkeletonBlock height="h-64" />
      <SkeletonBlock height="h-96" />
    </LoadingContainer>
  );
}
