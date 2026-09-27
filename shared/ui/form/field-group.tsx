import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type FieldGroupColumns = 1 | 2 | 3;

export type FieldGroupProps = {
  children: ReactNode;
  columns?: FieldGroupColumns;
  className?: string;
  testId?: string;
};

/**
 * ViNha Canonical FieldGroup.
 * Manages responsive layout and spacing for related form controls.
 * Stacks into single-column on narrow 360px viewports to protect numeric entry touch targets.
 * Strictly layout-only; contains zero financial business logic.
 */
export function FieldGroup({
  children,
  columns = 2,
  className,
  testId,
}: FieldGroupProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "grid w-full gap-(--space-3)",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 min-[390px]:grid-cols-2",
        columns === 3 && "grid-cols-1 min-[390px]:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
