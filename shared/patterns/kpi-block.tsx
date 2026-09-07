import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { Card, type CardTone } from "./card";

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

const KPI_SURFACE_TONE = {
  [KpiBlockVariant.SURFACE]: "soft",
  [KpiBlockVariant.PROMINENT]: "default",
} as const satisfies Record<
  Exclude<KpiBlockVariant, typeof KpiBlockVariant.PLAIN>,
  CardTone
>;

const KPI_SURFACE_CLASS = {
  [KpiBlockVariant.SURFACE]: "border-border-subtle/70",
  [KpiBlockVariant.PROMINENT]: "border-accent/20 bg-accent/10",
} as const satisfies Record<
  Exclude<KpiBlockVariant, typeof KpiBlockVariant.PLAIN>,
  string
>;

function KpiBlockBody({
  title,
  description,
  children,
}: Pick<KpiBlockProps, "title" | "description" | "children">) {
  return (
    <>
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
    </>
  );
}

/** Answer-oriented metric zone; keeps financial hierarchy consistent without forcing every section into a card. */
export function KpiBlock({
  title,
  description,
  children,
  variant = KpiBlockVariant.PLAIN,
  className,
  "data-testid": testId,
}: KpiBlockProps) {
  const content = (
    <KpiBlockBody title={title} description={description}>
      {children}
    </KpiBlockBody>
  );
  const resolvedTestId = testId ?? "kpi-block";

  if (variant === KpiBlockVariant.PLAIN) {
    return (
      <section
        className={cn("flex flex-col gap-(--space-3)", className)}
        data-testid={resolvedTestId}
      >
        {content}
      </section>
    );
  }

  return (
    <Card
      tone={KPI_SURFACE_TONE[variant]}
      className={cn(
        "flex flex-col gap-(--space-3) p-(--space-4)",
        KPI_SURFACE_CLASS[variant],
        className,
      )}
      data-testid={resolvedTestId}
    >
      {content}
    </Card>
  );
}
