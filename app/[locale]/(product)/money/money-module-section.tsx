import type { ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  MoneyModuleAttentionLevel,
  type MoneyModuleAttentionLevel as AttentionLevel,
} from "@/modules/ledger/application";
import { Link } from "@/i18n/navigation";
import { Card } from "@/shared/patterns/card";
import { Section } from "@/shared/patterns/section";
import { FinancialValue } from "@/shared/patterns/financial-value";
import {
  IconContainer,
  type IconContainerTone,
} from "@/shared/ui/icon-container";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";

/** Right-column state for a module row; a failed domain read never renders as zero. */
export type MoneyModuleValue =
  | { state: "value"; label: string }
  | { state: "count"; label: string }
  | { state: "empty"; label: string }
  | { state: "unavailable"; label: string };

export type MoneyModuleRowProps = {
  href: string;
  testId: string;
  icon: IconSvgElement;
  iconTone: IconContainerTone;
  label: string;
  value: MoneyModuleValue;
  /** Quiet supporting signal under the label (counts, secondary amounts). */
  meta?: ReactNode;
  attention?: { level: AttentionLevel; label: string } | null;
};

const EMPHASIZED_MODULE_VALUE_STATES = new Set<MoneyModuleValue["state"]>([
  "value",
  "count",
]);

const ATTENTION_BADGE_TONE: Record<
  AttentionLevel,
  typeof StatusBadgeTone.WARNING | typeof StatusBadgeTone.ATTENTION
> = {
  [MoneyModuleAttentionLevel.WARNING]: StatusBadgeTone.WARNING,
  [MoneyModuleAttentionLevel.CRITICAL]: StatusBadgeTone.ATTENTION,
};

/**
 * One money domain inside a grouped module card. Current-state amounts stay
 * neutral; attention (due soon / overdue / action required) is the only
 * colored element and always carries text, never color alone.
 */
export function MoneyModuleRow({
  href,
  testId,
  icon,
  iconTone,
  label,
  value,
  meta,
  attention,
}: MoneyModuleRowProps) {
  return (
    <Link
      href={href}
      className="flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-2) transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
      data-testid={testId}
    >
      <IconContainer tone={iconTone} size="sm">
        <AppIcon icon={icon} size="sm" />
      </IconContainer>
      <div className="min-w-0 flex-1">
        <Text size="sm" className="font-medium text-text-primary">
          {label}
        </Text>
        {attention ? (
          <StatusBadge
            tone={ATTENTION_BADGE_TONE[attention.level]}
            className="mt-(--space-1) min-h-6 rounded-(--radius-control) px-(--space-2) font-medium"
          >
            {attention.label}
          </StatusBadge>
        ) : meta ? (
          <Text size="xs" tone="muted" className="mt-(--space-1) block">
            {meta}
          </Text>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-(--space-2)">
        <span
          className={
            EMPHASIZED_MODULE_VALUE_STATES.has(value.state)
              ? "text-sm font-semibold tabular-nums tracking-tight text-text-primary"
              : "text-sm tabular-nums text-text-secondary"
          }
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
    </Link>
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
    <Section title={title} description={description} testId={testId}>
      <Card tone="elevated" className="gap-0 p-0">
        <div className="flex flex-col divide-y divide-border-subtle/65 py-(--space-1)">
          {children}
        </div>
      </Card>
    </Section>
  );
}
