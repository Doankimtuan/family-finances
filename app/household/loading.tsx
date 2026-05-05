import { LoadingContainer } from "@/components/ui/loading-container";
import { SkeletonBlock } from "@/components/ui/skeleton-builders";

export default function HouseholdLoading() {
  return (
    <LoadingContainer>
      <SkeletonBlock height="h-40" />
      <SkeletonBlock height="h-52" />
      <SkeletonBlock height="h-44" />
    </LoadingContainer>
  );
}
