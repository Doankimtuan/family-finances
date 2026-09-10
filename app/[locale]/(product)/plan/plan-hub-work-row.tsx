import type { ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  IconContainer,
  type IconContainerTone,
} from "@/shared/ui/icon-container";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { PLAN_DESTINATION_ROW_CLASS } from "./plan-chrome";

export const PlanHubWorkObject = {
  JAR: "jar",
  GOAL: "goal",
} as const;

export type PlanHubWorkObject =
  (typeof PlanHubWorkObject)[keyof typeof PlanHubWorkObject];

export type PlanHubWorkRowProps = {
  href: string;
  testId: string;
  icon: IconSvgElement;
  iconTone: IconContainerTone;
  label: string;
  meta: ReactNode;
  value: ReactNode;
  valueTone?: "primary" | "secondary" | "danger";
  marksIntention?: boolean;
  financialObject: PlanHubWorkObject;
};

export function PlanHubWorkRow({
  href,
  testId,
  icon,
  iconTone,
  label,
  meta,
  value,
  valueTone = "primary",
  marksIntention = true,
  financialObject,
}: PlanHubWorkRowProps) {
  return (
    <Link
      href={href}
      prefetch={PRODUCT_LINK_PREFETCH}
      className={PLAN_DESTINATION_ROW_CLASS}
      data-testid={testId}
      data-financial-object={financialObject}
    >
      <IconContainer tone={iconTone} size="sm">
        <AppIcon icon={icon} size="sm" />
      </IconContainer>
      <div className="min-w-0 flex-1">
        <Text size="sm" weight="medium" className="text-pretty">
          {label}
        </Text>
        <Text
          size="xs"
          tone="muted"
          className="mt-(--space-1) block text-pretty"
        >
          {meta}
        </Text>
      </div>
      <div className="flex shrink-0 items-center gap-(--space-2)">
        <Text
          size="sm"
          weight="semibold"
          tone={valueTone}
          tabular
          className="max-w-[9.5rem] text-right tracking-tight"
          data-financial-kind={
            marksIntention ? FinancialNumberKind.INTENTION : undefined
          }
        >
          {value}
        </Text>
        <AppIcon
          icon={ACTION_ICONS.forward}
          size="sm"
          className="shrink-0 text-text-tertiary"
        />
      </div>
    </Link>
  );
}
