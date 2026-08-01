import { LoadingContainer } from "@/components/ui/loading-container";
import { SkeletonBlock } from "@/components/ui/skeleton-builders";

export default function DecisionToolsLoading() {
  return (
    <LoadingContainer variant="full-page">
      <SkeletonBlock height="h-20" />
      <SkeletonBlock height="h-[620px]" />
    </LoadingContainer>
  );
}
