import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { Card } from "@/shared/patterns/card";
import { Section } from "@/shared/patterns/section";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { PLAN_INLINE_LINK_CLASS } from "./plan-chrome";
import { PlanSectionTitle } from "./plan-section-title";
import { exceptionHref } from "./plan-hub-presentations";
import type { PlanHomeException } from "@/modules/plan/application/plan-home-health";

type PlanHubExceptionsProps = {
  title: string;
  exceptions: readonly PlanHomeException[];
  hiddenCount: number;
  viewAllHref: string;
  viewAllLabel: string;
  renderTitle: (exception: PlanHomeException) => string;
  renderDescription: (exception: PlanHomeException) => ReactNode;
  renderAction: (exception: PlanHomeException) => string;
};

export function PlanHubExceptions({
  title,
  exceptions,
  hiddenCount,
  viewAllHref,
  viewAllLabel,
  renderTitle,
  renderDescription,
  renderAction,
}: PlanHubExceptionsProps) {
  if (exceptions.length === 0) return null;

  return (
    <Section
      title={<PlanSectionTitle>{title}</PlanSectionTitle>}
      testId="plan-home-exceptions"
    >
      <Card tone="warning" className="gap-0 overflow-hidden p-0">
        <ul className="divide-y divide-warning/20">
          {exceptions.map((exception, index) => {
            const description = renderDescription(exception);
            return (
              <li
                key={`${exception.kind}-${exception.jarId ?? exception.goalId ?? index}`}
              >
                <div className="flex items-start gap-(--space-3) px-(--space-4) py-(--space-3)">
                  <div className="min-w-0 flex-1">
                    <Text size="sm" weight="medium" className="text-pretty">
                      {renderTitle(exception)}
                    </Text>
                    {description ? (
                      <Text size="sm" tone="secondary" className="text-pretty">
                        {description}
                      </Text>
                    ) : null}
                  </div>
                  <Link
                    href={exceptionHref(exception)}
                    prefetch={PRODUCT_LINK_PREFETCH}
                    className={`${PLAN_INLINE_LINK_CLASS} shrink-0 gap-(--space-1) px-(--space-2)`}
                  >
                    {renderAction(exception)}
                    <AppIcon
                      icon={ACTION_ICONS.forward}
                      size="sm"
                      className="text-accent"
                    />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
      {hiddenCount > 0 ? (
        <Link
          href={viewAllHref}
          prefetch={PRODUCT_LINK_PREFETCH}
          className={PLAN_INLINE_LINK_CLASS}
        >
          {viewAllLabel}
        </Link>
      ) : null}
    </Section>
  );
}
