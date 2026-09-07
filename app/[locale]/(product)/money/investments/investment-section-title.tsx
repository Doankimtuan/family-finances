import type { ReactNode } from "react";
import { Heading } from "@/shared/ui/heading";

type InvestmentSectionTitleProps = {
  children: ReactNode;
};

/** Home-aligned section title: quiet label, not a second screen heading. */
export function InvestmentSectionTitle({
  children,
}: InvestmentSectionTitleProps) {
  return (
    <Heading
      level={2}
      className="text-sm font-semibold tracking-tight text-text-primary"
      data-slot="section-title"
    >
      {children}
    </Heading>
  );
}
