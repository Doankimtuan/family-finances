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
        "button min-h-11 min-w-11 rounded-(--radius-control)",
        "transition-[transform,background-color] duration-(--duration-fast) ease-(--ease-standard)",
        "active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:transform-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        className,
      )}
      {...props}
    />
  );
}
