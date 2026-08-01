"use client";

import {
  Button as HeroButton,
  type ButtonProps as HeroButtonProps,
} from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export type IconButtonProps = Omit<HeroButtonProps, "isIconOnly"> & {
  "aria-label": string;
};

export function IconButton({ className, ...props }: IconButtonProps) {
  return (
    <HeroButton
      isIconOnly
      className={cn(
        "transition-[transform,background-color] duration-(--duration-fast) ease-(--ease-standard)",
        "motion-reduce:transition-none motion-reduce:active:transform-none",
        className,
      )}
      {...props}
    />
  );
}
