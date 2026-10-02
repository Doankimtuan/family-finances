"use client";

import { useTranslations } from "next-intl";
import { OPENING_POSITION_STEP_VALUES } from "@/modules/investments/application/investment-constants";
import { Card } from "@/shared/patterns/card";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Progress } from "@/shared/ui/progress";
import { cn } from "@/shared/utils/cn";

export function OpeningStepIndicator({ stepIndex }: { stepIndex: number }) {
  const t = useTranslations("money.investments.opening");
  return (
    <Card
      tone="elevated"
      className="gap-(--space-2) p-(--space-3)"
      data-testid="investment-step-indicator"
    >
      <ol className="flex items-start justify-between gap-(--space-2)">
        {OPENING_POSITION_STEP_VALUES.map((step, index) => (
          <li
            key={step}
            aria-current={index === stepIndex ? "step" : undefined}
            className={cn(
              "flex min-w-0 items-center gap-(--space-1) text-xs",
              index <= stepIndex
                ? "font-semibold text-primary"
                : "text-text-secondary",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-xs",
                index === stepIndex
                  ? "bg-primary text-primary-fg"
                  : "bg-surface-muted",
              )}
            >
              {index < stepIndex ? (
                <AppIcon icon={ACTION_ICONS.check} size={AppIconSize.XS} />
              ) : (
                index + 1
              )}
            </span>
            <span>{t(`design.steps.${step}`)}</span>
          </li>
        ))}
      </ol>
      <Progress
        value={stepIndex + 1}
        max={OPENING_POSITION_STEP_VALUES.length}
        label={t("stepOf", {
          current: stepIndex + 1,
          total: OPENING_POSITION_STEP_VALUES.length,
        })}
        showLabel={false}
        trackClassName="h-1"
        indicatorClassName="bg-primary"
      />
    </Card>
  );
}
