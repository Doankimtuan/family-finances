import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { StatusBadge } from "@/shared/ui/status-badge";

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
        "flex flex-col gap-(--space-2) rounded-[var(--radius-card)] border border-border-subtle/60 bg-surface/90 transition-[background-color,border-color,transform] duration-(--duration-fast) hover:border-border-default hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 p-(--space-4)",
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
        <StatusBadge tone={state === "active" ? "positive" : "neutral"}>
          {stateLabel}
        </StatusBadge>
      </div>
      {planLabel ? (
        <Text size="sm" tone="secondary" className="tabular-nums">
          {planLabel}
        </Text>
      ) : null}
    </div>
  );
}
