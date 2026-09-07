import type { ReactNode } from "react";
import { InboxQueueHeaderState } from "@/modules/inbox/application/inbox-constants";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { InboxPrivacyToggle } from "./inbox-privacy-toggle";

export type InboxSummaryFact = {
  label: string;
  value: ReactNode;
};

type InboxSummaryProps = {
  state: InboxQueueHeaderState;
  headline: string;
  supporting: string;
  facts: readonly InboxSummaryFact[];
};

function summaryTone(state: InboxQueueHeaderState): "warning" | "soft" {
  return state === InboxQueueHeaderState.OPEN ? "warning" : "soft";
}

/**
 * Attention-center summary. Pending work uses the shared warning surface;
 * a clear or archived queue stays quiet. Not a money hero.
 */
export function InboxSummary({
  state,
  headline,
  supporting,
  facts,
}: InboxSummaryProps) {
  const tone = summaryTone(state);

  return (
    <div className="flex flex-col gap-(--space-3)">
      <Card
        tone={tone}
        className="gap-(--space-3) p-(--space-4)"
        data-testid="inbox-summary"
      >
        <div className="flex items-start justify-between gap-(--space-3)">
          <div className="min-w-0">
            <Text className="text-lg font-semibold tracking-tight text-text-primary text-balance">
              {headline}
            </Text>
            <Text
              size="sm"
              tone="secondary"
              className="mt-(--space-1) max-w-[32rem] text-pretty leading-relaxed"
            >
              {supporting}
            </Text>
          </div>
          <InboxPrivacyToggle testId="inbox-financial-privacy-toggle" />
        </div>
      </Card>
      {facts.length > 0 ? (
        <Card
          tone="elevated"
          className="gap-0 p-(--space-4)"
          data-testid="inbox-summary-facts"
        >
          <dl
            className={
              facts.length === 1
                ? "grid grid-cols-1"
                : "grid grid-cols-2 gap-(--space-3)"
            }
          >
            {facts.map((fact) => (
              <div key={fact.label} className="min-w-0">
                <Text size="xs" tone="muted" className="text-pretty">
                  {fact.label}
                </Text>
                <Text
                  size="sm"
                  weight="semibold"
                  className="mt-(--space-1) tracking-tight"
                >
                  {fact.value}
                </Text>
              </div>
            ))}
          </dl>
        </Card>
      ) : null}
    </div>
  );
}
