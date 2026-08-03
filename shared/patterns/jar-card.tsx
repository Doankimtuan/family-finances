import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";

export type JarCardProps = {
  name: ReactNode;
  kindLabel: ReactNode;
  stateLabel: ReactNode;
  state: "active" | "paused" | "archived";
  planLabel?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

/**
 * Intention jar summary — never labels amounts as bank Balance (BR-01).
 */
export function JarCard({
  name,
  kindLabel,
  stateLabel,
  state,
  planLabel,
  className,
  "data-testid": testId,
}: JarCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-(--space-2) rounded-lg border border-border-subtle bg-surface p-(--space-4)",
        className,
      )}
      data-testid={testId}
      data-jar-state={state}
    >
      <div className="flex items-center justify-between gap-(--space-3)">
        <div className="min-w-0">
          <Text size="sm" className="truncate font-medium text-text-primary">
            {name}
          </Text>
          <Text size="sm" tone="secondary">
            {kindLabel}
          </Text>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md border px-(--space-2) py-(--space-1) text-xs font-medium",
            state === "active" &&
              "border-accent/40 bg-accent/10 text-text-primary",
            state === "paused" && "border-border-subtle text-text-secondary",
            state === "archived" && "border-border-subtle text-text-secondary",
          )}
        >
          {stateLabel}
        </span>
      </div>
      {planLabel ? (
        <Text size="sm" tone="secondary" className="tabular-nums">
          {planLabel}
        </Text>
      ) : null}
    </div>
  );
}
