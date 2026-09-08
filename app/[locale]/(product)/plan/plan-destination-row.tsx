import type { ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { Card } from "@/shared/patterns/card";
import { Section } from "@/shared/patterns/section";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  IconContainer,
  type IconContainerTone,
} from "@/shared/ui/icon-container";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { PLAN_DESTINATION_ROW_CLASS } from "./plan-chrome";
import { PlanSectionTitle } from "./plan-section-title";

export type PlanDestinationRowProps = {
  href: string;
  testId: string;
  icon: IconSvgElement;
  iconTone: IconContainerTone;
  label: string;
  meta: ReactNode;
};

export function PlanDestinationRow({
  href,
  testId,
  icon,
  iconTone,
  label,
  meta,
}: PlanDestinationRowProps) {
  return (
    <Link
      href={href}
      prefetch={PRODUCT_LINK_PREFETCH}
      className={PLAN_DESTINATION_ROW_CLASS}
      data-testid={testId}
    >
      <IconContainer tone={iconTone} size="sm">
        <AppIcon icon={icon} size="sm" />
      </IconContainer>
      <div className="min-w-0 flex-1">
        <Text size="sm" weight="medium">
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
      <AppIcon
        icon={ACTION_ICONS.forward}
        size="sm"
        className="shrink-0 text-text-tertiary"
      />
    </Link>
  );
}

export function PlanDestinationCard({
  title,
  testId,
  children,
}: {
  title: string;
  testId: string;
  children: ReactNode;
}) {
  return (
    <Section
      title={<PlanSectionTitle>{title}</PlanSectionTitle>}
      testId={testId}
    >
      <Card tone="elevated" className="gap-0 p-0">
        <div className="flex flex-col divide-y divide-border-subtle/65 py-(--space-1)">
          {children}
        </div>
      </Card>
    </Section>
  );
}
