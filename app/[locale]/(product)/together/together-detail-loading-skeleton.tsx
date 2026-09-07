import { Page } from "@/shared/patterns/page";
import { Card } from "@/shared/patterns/card";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Skeleton } from "@/shared/ui/skeleton";

export function TogetherDetailLoadingSkeleton({
  testId,
  title,
  subtitle,
}: {
  testId?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Page
      testId={testId}
      topBar={<TopAppBar variant="detail" title={title} subtitle={subtitle} />}
    >
      <Card tone="elevated" className="gap-0 overflow-hidden p-0">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="flex items-center gap-(--space-3) border-b border-divider p-(--space-4) last:border-b-0"
          >
            <Skeleton className="size-10 rounded-(--radius-control)" />
            <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </Card>
    </Page>
  );
}
