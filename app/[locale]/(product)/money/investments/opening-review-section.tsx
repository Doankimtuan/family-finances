import type { ReactNode } from "react";
import { Amount, AmountSize } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import {
  InvestmentFactNote,
  InvestmentFactRow,
  InvestmentFactsCard,
} from "./investment-facts";

export type OpeningReviewFact = {
  label: string;
  value: ReactNode;
};

type OpeningReviewSectionProps = {
  title: string;
  subtitle: string;
  holdingName: string;
  trackedAsset?: string;
  heroLabel: string;
  heroAmount: string;
  heroMeta: string;
  facts: OpeningReviewFact[];
  sideTitle: string;
  sideSubtitle?: string;
  sideFacts: OpeningReviewFact[];
};

/** Review chrome for the opening wizard. Callers still own formatted values. */
export function OpeningReviewSection({
  title,
  subtitle,
  holdingName,
  trackedAsset,
  heroLabel,
  heroAmount,
  heroMeta,
  facts,
  sideTitle,
  sideSubtitle,
  sideFacts,
}: OpeningReviewSectionProps) {
  return (
    <section
      className="flex flex-col gap-(--space-5)"
      aria-labelledby="investment-review-title"
      data-testid="investment-opening-preview"
    >
      <div className="space-y-(--space-1)">
        <Text
          as="div"
          role="heading"
          aria-level={1}
          size="lg"
          weight="semibold"
          id="investment-review-title"
        >
          {title}
        </Text>
        <Text size="sm" tone="secondary">
          {subtitle}
        </Text>
      </div>
      <Card tone="hero" className="gap-0 p-(--space-4)">
        <Text size="sm" weight="medium" className="text-hero-muted">
          {heroLabel}
        </Text>
        <Amount
          amountLabel={heroAmount}
          size={AmountSize.HERO}
          className="mt-(--space-2)"
          amountClassName="text-hero-fg"
        />
        <Text size="xs" className="mt-(--space-1) text-pretty text-hero-muted">
          {holdingName}
          {heroMeta ? ` · ${heroMeta}` : ""}
        </Text>
        {trackedAsset ? (
          <Text
            size="xs"
            className="mt-(--space-1) text-pretty text-hero-muted"
          >
            {trackedAsset}
          </Text>
        ) : null}
      </Card>
      <InvestmentFactsCard>
        {facts.map((fact) => (
          <InvestmentFactRow
            key={fact.label}
            label={fact.label}
            value={fact.value}
          />
        ))}
      </InvestmentFactsCard>
      <InvestmentFactsCard title={sideTitle}>
        {sideSubtitle ? (
          <InvestmentFactNote>{sideSubtitle}</InvestmentFactNote>
        ) : null}
        {sideFacts.map((fact) => (
          <InvestmentFactRow
            key={fact.label}
            label={fact.label}
            value={fact.value}
          />
        ))}
      </InvestmentFactsCard>
    </section>
  );
}
