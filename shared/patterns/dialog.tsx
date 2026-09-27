"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { DialogContent as BaseDialogContent } from "@/shared/ui/dialog";

export { Dialog } from "@/shared/ui/dialog";

export function DialogContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <BaseDialogContent
      containerClassName={cn("max-w-[min(100%,400px)]", className)}
      surfaceClassName="p-0 max-h-none gap-0 overflow-visible"
    >
      {children}
    </BaseDialogContent>
  );
}
