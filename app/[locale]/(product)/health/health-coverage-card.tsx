import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import type { HealthCompleteness } from "@/modules/health/application/health-pulse";

type HealthCoverageCopy = {
  title: string;
  body: string;
  missingAccounts: string;
  missingPlan: string;
};

export function HealthCoverageCard({
  completeness,
  copy,
}: {
  completeness: HealthCompleteness;
  copy: HealthCoverageCopy;
}) {
  return (
    <Card
      tone="soft"
      className="gap-(--space-2) p-(--space-4)"
      data-testid="health-coverage"
    >
      <Text size="sm" weight="semibold" className="text-text-primary">
        {copy.title}
      </Text>
      <Text size="sm" tone="secondary" className="text-pretty leading-relaxed">
        {copy.body}
      </Text>
      {completeness.missingAccounts ? (
        <Text size="sm" tone="secondary" className="text-pretty">
          {copy.missingAccounts}
        </Text>
      ) : null}
      {completeness.missingPlan ? (
        <Text size="sm" tone="secondary" className="text-pretty">
          {copy.missingPlan}
        </Text>
      ) : null}
    </Card>
  );
}
