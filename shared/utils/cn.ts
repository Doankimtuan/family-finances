import { cn as herouiCn } from "@heroui/react";

/** Token-safe classname merge (via HeroUI / tailwind-variants). */
export function cn(...inputs: Parameters<typeof herouiCn>) {
  return herouiCn(...inputs);
}
