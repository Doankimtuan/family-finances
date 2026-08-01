import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "@/shared/utils/cn";

const textStyles = tv({
  base: "leading-relaxed text-text-primary",
  variants: {
    tone: {
      primary: "text-text-primary",
      secondary: "text-text-secondary",
      muted: "text-text-muted",
      accent: "text-accent",
      danger: "text-danger",
      success: "text-success",
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
