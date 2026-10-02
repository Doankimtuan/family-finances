import type { ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  MoneyModuleAttentionLevel,
  type MoneyModuleAttentionLevel as AttentionLevel,
} from "@/modules/ledger/application";
import { BaseRow } from "@/shared/patterns/base-row";
import { Card } from "@/shared/patterns/card";
import { Section } from "@/shared/patterns/section";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FinancialValue } from "@/shared/patterns/financial-value";
import {
  IconContainer,
  type IconContainerTone,
} from "@/shared/ui/icon-container";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { Heading } from "@/shared/ui/heading";

/** Right-column state for a module row; a failed domain read never renders as zero. */
export type MoneyModuleValue =
  | { state: "value"; label: string; kind?: FinancialNumberKind }
  | { state: "count"; label: string }
  | { state: "empty"; label: string }
  | { state: "unavailable"; label: string };

export type MoneyModuleRowProps = {
  href: string;
  testId: string;
  icon: IconSvgElement;
  iconTone: IconContainerTone;
  iconClassName?: string;
  label: string;
  value: MoneyModuleValue;
  /** Quiet supporting signal under the label (counts, secondary amounts). */
  meta?: ReactNode;
  /** Current domain status, such as whether investment prices are fresh. */
  status?: { label: string; tone: StatusBadgeTone };
  /** Quiet status beneath the amount for obligation rows. */
  trailingMeta?: ReactNode;
  attention?: { level: AttentionLevel; label: string } | null;
};

const EMPHASIZED_MODULE_VALUE_STATES = new Set<MoneyModuleValue["state"]>([
  "value",
  "count",
]);

function moduleValueClassName(value: MoneyModuleValue) {
  if (!EMPHASIZED_MODULE_VALUE_STATES.has(value.state)) {
    return "text-sm tabular-nums text-text-secondary";
  }
  if (value.state === "value" && value.kind === FinancialNumberKind.ESTIMATE) {
    return "text-sm font-medium tabular-nums tracking-tight text-text-primary";
  }
  return "text-sm font-semibold tabular-nums tracking-tight text-text-primary";
}

function moduleValueKind(value: MoneyModuleValue) {
  return value.state === "value"
    ? (value.kind ?? FinancialNumberKind.CURRENT_STATE)
    : undefined;
}

const ATTENTION_BADGE_TONE: Record<
  AttentionLevel,
  typeof StatusBadgeTone.WARNING | typeof StatusBadgeTone.ATTENTION
> = {
  [MoneyModuleAttentionLevel.WARNING]: StatusBadgeTone.WARNING,
  [MoneyModuleAttentionLevel.CRITICAL]: StatusBadgeTone.ATTENTION,
};

/**
 * One money domain inside a grouped module card. Amounts stay neutral; any
 * colored status has a factual text label beside it.
 */
export function MoneyModuleRow({
  href,
  testId,
  icon,
  iconTone,
  iconClassName,
  label,
  value,
  meta,
  status,
  trailingMeta,
  attention,
}: MoneyModuleRowProps) {
  return (
    <BaseRow
      href={href}
      data-testid={testId}
      divider="none"
      interactiveClassName="hover:bg-surface-hover/50"
      leading={
        <IconContainer tone={iconTone} size="md" className={iconClassName}>
          <AppIcon icon={icon} size="md" />
        </IconContainer>
      }
      title={
        <Text size="sm" className="font-medium text-text-primary">
          {label}
        </Text>
      }
      subtitle={
        attention || status || meta ? (
          <div className="flex min-w-0 flex-col items-start gap-(--space-1)">
            {attention ? (
              <StatusBadge
                tone={ATTENTION_BADGE_TONE[attention.level]}
                className="min-h-6 whitespace-nowrap rounded-(--radius-control) px-(--space-2) font-medium"
              >
                {attention.label}
              </StatusBadge>
            ) : null}
            {status ? (
              <StatusBadge
                tone={status.tone}
                className="min-h-6 whitespace-nowrap rounded-(--radius-control) px-(--space-2) font-medium"
              >
                {status.label}
              </StatusBadge>
            ) : null}
            {meta ? (
              <Text size="xs" tone="muted" className="block whitespace-normal">
                {meta}
              </Text>
            ) : null}
          </div>
        ) : null
      }
      subtitleClassName="overflow-visible whitespace-normal"
      trailing={
        <>
          <div className="flex shrink-0 items-center gap-(--space-2)">
            <span
              className={moduleValueClassName(value)}
              data-financial-kind={moduleValueKind(value)}
            >
              {value.state === "count" ? (
                value.label
              ) : (
                <FinancialValue>{value.label}</FinancialValue>
              )}
            </span>
            <AppIcon
              icon={ACTION_ICONS.forward}
              size="sm"
              className="shrink-0 text-text-tertiary"
            />
          </div>
          {trailingMeta}
        </>
      }
      trailingClassName={trailingMeta ? "max-w-32 min-w-0" : undefined}
      contentClassName="py-(--space-3)"
    />
  );
}

/**
 * A grouped financial module: section title on the canvas, then divided
 * navigation rows in one elevated card. Dense by design so major domains stay
 * scannable without turning each one into a standalone card.
 */
export function MoneyModuleCard({
  title,
  description,
  testId,
  children,
}: {
  title: string;
  description?: string;
  testId: string;
  children: ReactNode;
}) {
  return (
    <Section
      title={
        <Heading
          level={2}
          className="text-xs font-semibold tracking-wider uppercase text-text-secondary"
        >
          {title}
        </Heading>
      }
      description={description}
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
