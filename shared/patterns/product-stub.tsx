import type { ReactNode } from "react";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Text } from "@/shared/ui/text";

/**
 * Shared IA stub shell — TopAppBar + optional lead + EmptyState.
 * No domain data.
 */
export function ProductStub({
  title,
  lead,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  lead?: ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <TopAppBar title={title} />
      <div className="flex flex-1 flex-col px-(--space-4) pb-(--space-6) pt-(--space-4)">
        {lead ? (
          <div className="mb-(--space-4)">
            {typeof lead === "string" ? (
              <Text tone="secondary" size="sm">
                {lead}
              </Text>
            ) : (
              lead
            )}
          </div>
        ) : null}
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          className="flex-1"
        />
      </div>
    </div>
  );
}
