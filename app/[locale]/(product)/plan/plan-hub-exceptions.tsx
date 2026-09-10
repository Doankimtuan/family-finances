import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { Card } from "@/shared/patterns/card";
import { Section } from "@/shared/patterns/section";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import {
  PLAN_DESTINATION_ROW_CLASS,
  PLAN_INLINE_LINK_CLASS,
} from "./plan-chrome";
import { PlanSectionTitle } from "./plan-section-title";
import { exceptionHref } from "./plan-hub-presentations";
import type { PlanHomeException } from "@/modules/plan/application/plan-home-health";

type PlanHubExceptionsProps = {
  title: string;
  emptyTitle: string;
  emptyBody: string;
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
  emptyTitle,
  emptyBody,
  exceptions,
  hiddenCount,
  viewAllHref,
  viewAllLabel,
  renderTitle,
  renderDescription,
  renderAction,
}: PlanHubExceptionsProps) {
  return (
    <Section
      title={<PlanSectionTitle>{title}</PlanSectionTitle>}
      testId="plan-home-exceptions"
    >
      {exceptions.length === 0 ? (
        <div className="flex flex-col gap-(--space-1)">
          <Text size="sm" weight="medium">
            {emptyTitle}
          </Text>
          <Text size="sm" tone="secondary" className="text-pretty">
            {emptyBody}
          </Text>
        </div>
      ) : (
        <Card tone="warning" className="gap-0 overflow-hidden p-0">
          <ul className="divide-y divide-warning/20">
            {exceptions.map((exception, index) => {
              const itemTitle = renderTitle(exception);
              const description = renderDescription(exception);
              const action = renderAction(exception);
              return (
                <li
                  key={`${exception.kind}-${exception.jarId ?? exception.goalId ?? index}`}
                >
                  <Link
                    href={exceptionHref(exception)}
                    prefetch={PRODUCT_LINK_PREFETCH}
                    aria-label={`${itemTitle}. ${action}`}
                    className={PLAN_DESTINATION_ROW_CLASS}
                  >
                    <div className="min-w-0 flex-1">
                      <Text size="sm" weight="medium" className="text-pretty">
                        {itemTitle}
                      </Text>
                      {description ? (
                        <Text
                          size="sm"
                          tone="secondary"
                          className="text-pretty"
                        >
                          {description}
                        </Text>
                      ) : null}
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-(--space-1) text-sm font-semibold text-accent">
                      {action}
                      <AppIcon
                        icon={ACTION_ICONS.forward}
                        size="sm"
                        className="text-accent"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
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
