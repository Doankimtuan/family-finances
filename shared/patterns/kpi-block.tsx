import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";

export type KpiBlockProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  variant?: "plain" | "surface" | "prominent";
  className?: string;
  "data-testid"?: string;
};

/**
 * Home answer metric zone (Design System KPIBlock).
 * Prefer over wrapping every metric in Card.
 */
export function KpiBlock({
  title,
  description,
  children,
  variant = "plain",
  className,
  "data-testid": testId,
}: KpiBlockProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-(--space-3)",
        variant === "surface" &&
          "rounded-xl border border-border-subtle bg-surface p-(--space-4)",
        variant === "prominent" &&
          "rounded-xl border border-accent/25 bg-accent/10 p-(--space-4) shadow-[var(--elevation-1)]",
        className,
      )}
      data-testid={testId ?? "kpi-block"}
    >
      <div className="flex flex-col gap-(--space-1)">
        {typeof title === "string" ? (
          <Text size="sm" className="font-medium text-text-primary">
            {title}
          </Text>
        ) : (
          title
        )}
        {description ? (
          typeof description === "string" ? (
            <Text size="sm" tone="secondary" className="leading-relaxed">
              {description}
            </Text>
          ) : (
            description
          )
        ) : null}
      </div>
      {children}
    </section>
  );
}
