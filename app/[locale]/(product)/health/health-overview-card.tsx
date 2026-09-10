import { Card } from "@/shared/patterns/card";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";

export function HealthOverviewCard({
  title,
  score,
  levelLabel,
  narrative,
  scoreMeaning,
}: {
  title: string;
  score: number;
  levelLabel: string;
  narrative: string;
  scoreMeaning: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const pulseLabel = `${title}: ${clamped} / 100, ${levelLabel}`;

  return (
    <Card
      tone="elevated"
      className="gap-0 p-(--space-4)"
      data-testid="health-overview-card"
      aria-label={pulseLabel}
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="min-w-0">
          <Text size="sm" tone="secondary" weight="medium">
            {title}
          </Text>
          <p className="mt-(--space-2) text-2xl font-semibold leading-none tabular-nums tracking-tight text-text-primary">
            {clamped}
            <span className="text-sm font-medium text-text-secondary">
              /100
            </span>
          </p>
        </div>
        <StatusBadge
          tone={StatusBadgeTone.NEUTRAL}
          className="shrink-0"
          data-testid="health-card-level"
        >
          {levelLabel}
        </StatusBadge>
      </div>
      <Text
        size="sm"
        tone="secondary"
        className="mt-(--space-3) text-pretty leading-relaxed"
      >
        {narrative}
      </Text>
      <Text
        size="sm"
        tone="muted"
        className="mt-(--space-2) text-pretty leading-relaxed"
        data-testid="health-pulse-meaning"
      >
        {scoreMeaning}
      </Text>
    </Card>
  );
}
