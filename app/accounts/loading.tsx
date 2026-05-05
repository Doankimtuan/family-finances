import { LoadingContainer } from "@/components/ui/loading-container";
import { SkeletonLine, SkeletonBlock } from "@/components/ui/skeleton-builders";

export default function AccountsLoading() {
  return (
    <LoadingContainer>
      <SkeletonLine width="w-36" />
      <SkeletonBlock height="h-52" />
      <SkeletonBlock height="h-56" />
    </LoadingContainer>
  );
}
