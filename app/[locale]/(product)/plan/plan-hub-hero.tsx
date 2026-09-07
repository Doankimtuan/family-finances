import type { ReactNode } from "react";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { PlanPrivacyToggle } from "./plan-privacy-toggle";
import { planHealthDotClass } from "./plan-hub-presentations";
import type { PlanHomeHealthStatus as PlanHomeHealthStatusValue } from "@/modules/plan/application/plan-home-health";

type PlanHubFact = {
  label: string;
  value: ReactNode;
  tone?: "secondary" | "danger";
};

type PlanHubHeroProps = {
  periodCaption: string;
  periodLabel: string;
  assistLabel: string;
  health: PlanHomeHealthStatusValue;
  healthTitle: string;
  healthBody: string;
  facts: readonly PlanHubFact[];
};

export function PlanHubHero({
  periodCaption,
  periodLabel,
  assistLabel,
  health,
  healthTitle,
  healthBody,
  facts,
}: PlanHubHeroProps) {
  return (
    <div className="flex flex-col gap-(--space-3)">
      <Card
        tone="hero"
        className="gap-(--space-4) p-(--space-4)"
        data-testid="plan-period-pulse"
      >
        <div className="flex items-start justify-between gap-(--space-3)">
          <div className="min-w-0">
            <Text size="sm" weight="medium" className="text-hero-muted">
              {periodCaption}
            </Text>
            <Text className="mt-(--space-1) text-2xl font-semibold tracking-tight text-hero-fg text-balance">
              {periodLabel}
            </Text>
          </div>
          <div className="flex shrink-0 items-center gap-(--space-2)">
            <StatusBadge
              tone={StatusBadgeTone.SELECTED}
              className="bg-white/10 text-hero-fg ring-white/15"
            >
              {assistLabel}
            </StatusBadge>
            <PlanPrivacyToggle testId="plan-financial-privacy-toggle" />
          </div>
        </div>
        <div className="flex items-start gap-(--space-3) border-t border-white/15 pt-(--space-3)">
          <span
            className={`mt-1.5 size-2.5 shrink-0 rounded-full ${planHealthDotClass(health)}`}
            aria-hidden
          />
          <div className="min-w-0">
            <Text weight="semibold" className="text-hero-fg">
              {healthTitle}
            </Text>
            <Text size="sm" className="text-pretty text-hero-muted">
              {healthBody}
            </Text>
          </div>
        </div>
      </Card>
      <Card tone="elevated" className="gap-0 p-(--space-4)">
        <dl className="grid grid-cols-3 gap-(--space-3)">
          {facts.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <Text size="xs" tone="muted" className="text-pretty">
                {fact.label}
              </Text>
              <Text
                size="sm"
                weight="semibold"
                tone={fact.tone === "danger" ? "danger" : "primary"}
                className="mt-(--space-1) tracking-tight"
              >
                {fact.value}
              </Text>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
