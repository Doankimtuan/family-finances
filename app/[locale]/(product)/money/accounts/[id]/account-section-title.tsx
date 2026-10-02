import type { ReactNode } from "react";
import { Heading } from "@/shared/ui/heading";

type AccountSectionTitleProps = {
  children: ReactNode;
  id?: string;
};

/** Home-aligned section title: quiet label, not a second screen heading. */
export function AccountSectionTitle({
  children,
  id,
}: AccountSectionTitleProps) {
  return (
    <Heading
      level={2}
      id={id}
      className="text-sm font-semibold tracking-tight text-text-primary"
      data-slot="section-title"
    >
      {children}
    </Heading>
  );
}
