import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";

export const KpiBlockVariant = {
  PLAIN: "plain",
  SURFACE: "surface",
  PROMINENT: "prominent",
} as const;

export type KpiBlockVariant =
  (typeof KpiBlockVariant)[keyof typeof KpiBlockVariant];

export const KPI_BLOCK_VARIANT_VALUES = [
  KpiBlockVariant.PLAIN,
  KpiBlockVariant.SURFACE,
  KpiBlockVariant.PROMINENT,
] as const;

export type KpiBlockProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  variant?: KpiBlockVariant;
  className?: string;
  "data-testid"?: string;
};

/** Answer-oriented metric zone; keeps financial hierarchy consistent without forcing every section into a card. */
export function KpiBlock({
  title,
  description,
  children,
  variant = KpiBlockVariant.PLAIN,
  className,
  "data-testid": testId,
}: KpiBlockProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-(--space-3)",
        variant === KpiBlockVariant.SURFACE &&
          "rounded-(--radius-card) border border-border-subtle/70 bg-surface-muted/70 p-(--space-4)",
        variant === KpiBlockVariant.PROMINENT &&
          "rounded-(--radius-card) border border-accent/20 bg-accent/10 p-(--space-4)",
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
