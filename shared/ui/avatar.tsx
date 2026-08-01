"use client";

import {
  Avatar as HeroAvatar,
  type AvatarProps as HeroAvatarProps,
} from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export type AvatarProps = HeroAvatarProps;

export function Avatar({ className, ...props }: AvatarProps) {
  return <HeroAvatar className={cn(className)} {...props} />;
}

Avatar.Image = HeroAvatar.Image;
Avatar.Fallback = HeroAvatar.Fallback;
