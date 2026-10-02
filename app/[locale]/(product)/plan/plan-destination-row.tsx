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
  IconContainerTone,
  type IconContainerTone as IconContainerToneValue,
} from "@/shared/ui/icon-container";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { PLAN_DESTINATION_ROW_CLASS } from "./plan-chrome";
import { PlanSectionTitle } from "./plan-section-title";

export type PlanDestinationRowProps = {
  href: string;
  testId: string;
  icon: IconSvgElement;
  iconTone: IconContainerToneValue;
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

export function PlanDestinationTile({
  href,
  testId,
  icon,
  label,
  meta,
}: Pick<
  PlanDestinationRowProps,
  "href" | "testId" | "icon" | "label" | "meta"
>) {
  return (
    <Link
      href={href}
      prefetch={PRODUCT_LINK_PREFETCH}
      className="block h-full rounded-(--radius-card) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      data-testid={testId}
    >
      <Card tone="interactive" className="h-full gap-(--space-2) p-(--space-3)">
        <IconContainer tone={IconContainerTone.PRIMARY} size="xs">
          <AppIcon icon={icon} size="sm" />
        </IconContainer>
        <Text size="sm" weight="semibold" className="text-text-primary">
          {label}
        </Text>
        <Text size="xs" tone="muted" className="text-pretty">
          {meta}
        </Text>
      </Card>
    </Link>
  );
}

export function PlanDestinationCard({
  title,
  description,
  action,
  testId,
  children,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  testId: string;
  children: ReactNode;
}) {
  return (
    <Section
      title={<PlanSectionTitle>{title}</PlanSectionTitle>}
      description={description}
      action={action}
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
