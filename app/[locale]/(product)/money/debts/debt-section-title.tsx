import type { ReactNode } from "react";
import { Heading } from "@/shared/ui/heading";

type DebtSectionTitleProps = {
  children: ReactNode;
};

/** Home-aligned section title: quiet label, not a second screen heading. */
export function DebtSectionTitle({ children }: DebtSectionTitleProps) {
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
