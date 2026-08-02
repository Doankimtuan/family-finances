import type { ReactNode } from "react";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { BrandMark } from "@/shared/patterns/brand-mark";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Heading } from "@/shared/ui/heading";

/**
 * Shared IA stub shell — seamless page header + EmptyState.
 * String `lead` becomes the header subtitle (one composition, no hairline break).
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
  const stringLead = typeof lead === "string" ? lead : null;
  const blockLead = stringLead ? null : lead;

  const barTitle = showBrand ? (
    <div className="flex min-w-0 items-center gap-(--space-2)">
      <BrandMark variant="mark" size="sm" className="shrink-0" />
      <Heading
        level={1}
        className="truncate text-lg font-semibold tracking-tight text-text-primary"
      >
        {title}
      </Heading>
    </div>
  ) : (
    title
  );

  return (
    <div className="flex min-h-full flex-col">
      <TopAppBar title={barTitle} subtitle={stringLead ?? undefined} />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        {blockLead ? (
          <div className="flex min-w-0 flex-col gap-(--space-3)">
            {blockLead}
          </div>
        ) : null}
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          className={blockLead ? "flex-none py-(--space-6)" : "flex-1"}
        />
      </div>
    </div>
  );
}
