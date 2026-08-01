import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "@/shared/utils/cn";

const textStyles = tv({
  base: "text-[var(--color-text-primary)]",
  variants: {
    tone: {
      primary: "text-[var(--color-text-primary)]",
      secondary: "text-[var(--color-text-secondary)]",
      muted: "text-[var(--color-text-muted)]",
      accent: "text-[var(--color-accent)]",
      danger: "text-[var(--color-danger)]",
      success: "text-[var(--color-success)]",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
    },
    tabular: {
      true: "tabular-nums",
      false: "",
    },
  },
  defaultVariants: {
    tone: "primary",
    size: "base",
    weight: "normal",
    tabular: false,
  },
});

export type TextProps = React.ComponentPropsWithoutRef<"p"> &
  VariantProps<typeof textStyles> & {
    as?: "p" | "span" | "div";
  };

export function Text({
  as: Comp = "p",
  className,
  tone,
  size,
  weight,
  tabular,
  ...props
}: TextProps) {
  return (
    <Comp
      className={cn(textStyles({ tone, size, weight, tabular }), className)}
      {...props}
    />
  );
}
