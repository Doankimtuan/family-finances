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
  return <HeroButton isIconOnly className={cn(className)} {...props} />;
}
