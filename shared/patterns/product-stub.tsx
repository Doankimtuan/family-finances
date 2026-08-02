import type { ReactNode } from "react";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { BrandMark } from "@/shared/patterns/brand-mark";
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
  showBrand = false,
}: {
  title: string;
  lead?: ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
  /** When true, prepend Cradle & Seed mark to the top bar title (Home). */
  showBrand?: boolean;
}) {
  const barTitle = showBrand ? (
    <div className="flex min-w-0 items-center gap-(--space-2)">
      <BrandMark variant="mark" size="sm" className="shrink-0" />
      <span className="truncate text-base font-semibold tracking-tight text-text-primary">
        {title}
      </span>
    </div>
  ) : (
    title
  );

  return (
    <div className="flex min-h-full flex-col">
      <TopAppBar title={barTitle} />
      <div className="flex flex-1 flex-col px-(--space-4) pb-(--space-6) pt-(--space-5)">
        {lead ? (
          <div className="mb-(--space-5)">
            {typeof lead === "string" ? (
              <Text tone="secondary" size="sm" className="leading-relaxed">
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
