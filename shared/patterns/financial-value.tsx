"use client";

import type { ReactNode } from "react";
import { FINANCIAL_PRIVACY_MASK } from "@/shared/constants/financial-privacy";
import { useFinancialPrivacy } from "@/providers/financial-privacy-provider";
import { cn } from "@/shared/utils/cn";

export function FinancialValue({
  children,
  className,
  dataTestId,
}: {
  children: ReactNode;
  className?: string;
  dataTestId?: string;
}) {
  const { isHidden } = useFinancialPrivacy();

  return (
    <span
      className={cn(isHidden && "select-none", className)}
      data-testid={dataTestId}
    >
      {isHidden ? FINANCIAL_PRIVACY_MASK : children}
    </span>
  );
}
