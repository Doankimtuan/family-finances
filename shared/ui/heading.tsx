import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "@/shared/utils/cn";

const headingStyles = tv({
  base: "text-[var(--color-text-primary)] font-semibold tracking-tight",
  variants: {
    level: {
      1: "text-3xl",
      2: "text-2xl",
      3: "text-xl",
      4: "text-lg",
    },
  },
  defaultVariants: {
    level: 2,
  },
});

export type HeadingProps = React.ComponentPropsWithoutRef<"h1"> &
  VariantProps<typeof headingStyles>;

export function Heading({ className, level = 2, ...props }: HeadingProps) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
  return <Tag className={cn(headingStyles({ level }), className)} {...props} />;
}
