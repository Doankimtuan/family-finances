import type { ReactNode } from "react";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { INBOX_TEST_ID } from "@/modules/inbox/application/inbox-constants";

export type InboxSummaryFact = {
  label: string;
  value: ReactNode;
};

type InboxSummaryProps = {
  headline: string;
  supporting: string;
  facts: readonly InboxSummaryFact[];
};

/** Compact attention summary with queue state inside the same surface. */
export function InboxSummary({
  headline,
  supporting,
  facts,
}: InboxSummaryProps) {
  return (
    <Card
      tone="elevated"
      className="gap-(--space-2) rounded-(--radius-card) p-(--space-4)"
      data-testid={INBOX_TEST_ID.SUMMARY}
    >
      <div className="min-w-0">
        <Text className="text-lg font-semibold tracking-tight text-text-primary text-balance">
          {headline}
        </Text>
        <Text
          size="sm"
          tone="secondary"
          className="mt-(--space-1) text-pretty leading-snug"
        >
          {supporting}
        </Text>
      </div>

      {facts.length > 0 ? (
        <dl
          className="flex flex-wrap gap-(--space-2)"
          data-testid="inbox-summary-facts"
        >
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="inline-flex min-h-7 items-center gap-(--space-1) rounded-full bg-primary-soft px-(--space-2)"
            >
              <Text as="dt" size="xs" tone="secondary" className="text-pretty">
                {fact.label}
              </Text>
              <Text
                as="dd"
                size="sm"
                weight="semibold"
                className="tracking-tight"
              >
                {fact.value}
              </Text>
            </div>
          ))}
        </dl>
      ) : null}
    </Card>
  );
}
