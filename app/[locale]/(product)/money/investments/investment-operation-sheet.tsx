"use client";

import type { ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { Sheet } from "@/shared/patterns/sheet";

export function InvestmentOperationSheet({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <Sheet
      isOpen
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      {children}
    </Sheet>
  );
}
