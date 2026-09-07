import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";

export function HealthOverviewCard({
  title,
  score,
  levelLabel,
  narrative,
}: {
  title: string;
  score: number;
  levelLabel: string;
  narrative: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <Card
      tone="hero"
      className="gap-0 p-(--space-4)"
      data-testid="health-overview-card"
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="min-w-0">
          <Text size="sm" weight="medium" className="text-hero-muted">
            {title}
          </Text>
          <p className="mt-(--space-2) text-4xl font-semibold leading-none tabular-nums tracking-tight text-hero-fg">
            {clamped}
            <span className="text-base font-medium text-hero-muted">/100</span>
          </p>
        </div>
        <span
          className="inline-flex min-h-7 shrink-0 items-center rounded-full border border-white/25 bg-white/10 px-(--space-2) text-xs font-semibold leading-none text-hero-fg"
          data-testid="health-card-level"
        >
          {levelLabel}
        </span>
      </div>
      <Text
        size="sm"
        className="mt-(--space-3) text-pretty leading-relaxed text-hero-muted"
      >
        {narrative}
      </Text>
    </Card>
  );
}
