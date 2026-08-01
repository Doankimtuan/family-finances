import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "@/shared/utils/cn";

const headingStyles = tv({
  base: "font-semibold tracking-tight text-text-primary",
  variants: {
    level: {
      1: "text-3xl leading-tight",
      2: "text-2xl leading-snug",
      3: "text-xl leading-snug",
      4: "text-lg leading-snug",
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
