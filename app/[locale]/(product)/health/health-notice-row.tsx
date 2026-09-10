import type { ReactNode } from "react";
import { Text } from "@/shared/ui/text";

export function HealthNoticeRow({
  title,
  body,
  footer,
  testId,
}: {
  title: string;
  body: string;
  footer?: ReactNode;
  testId: string;
}) {
  return (
    <li className="px-(--space-4) py-(--space-3)" data-testid={testId}>
      <Text size="sm" weight="medium" className="text-pretty text-text-primary">
        {title}
      </Text>
      <Text
        size="sm"
        tone="secondary"
        className="mt-(--space-1) text-pretty leading-relaxed"
      >
        {body}
      </Text>
      {footer}
    </li>
  );
}
