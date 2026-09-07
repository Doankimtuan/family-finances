import type { ReactNode } from "react";
import { Heading } from "@/shared/ui/heading";

type HealthSectionTitleProps = {
  children: ReactNode;
};

/** Quiet section label under the Health summary — not a second screen title. */
export function HealthSectionTitle({ children }: HealthSectionTitleProps) {
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
