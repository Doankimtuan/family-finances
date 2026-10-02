"use client";

import {
  Avatar as HeroAvatar,
  AvatarFallback as HeroAvatarFallback,
  AvatarImage as HeroAvatarImage,
  type AvatarProps as HeroAvatarProps,
} from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export type AvatarProps = HeroAvatarProps;

export function Avatar({ className, ...props }: AvatarProps) {
  return <HeroAvatar className={cn(className)} {...props} />;
}

export const AvatarImage = HeroAvatarImage;
export const AvatarFallback = HeroAvatarFallback;
