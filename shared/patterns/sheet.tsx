"use client";

import type { ReactNode } from "react";
import { BottomSheetContent } from "@/shared/ui/bottom-sheet";
import { cn } from "@/shared/utils/cn";

export { BottomSheet as Sheet } from "@/shared/ui/bottom-sheet";

export function SheetContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <BottomSheetContent className={cn("h-dvh", className)}>
      {children}
    </BottomSheetContent>
  );
}
