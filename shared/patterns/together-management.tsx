import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  IconContainer,
  type IconContainerTone,
} from "@/shared/ui/icon-container";
import { ACTION_ICONS, NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";
import { Card } from "./card";

export const TogetherNavAppearance = {
  CARD: "card",
  GROUPED: "grouped",
} as const;

export type TogetherNavAppearance =
  (typeof TogetherNavAppearance)[keyof typeof TogetherNavAppearance];

export const TOGETHER_NAV_APPEARANCE_VALUES = [
  TogetherNavAppearance.CARD,
  TogetherNavAppearance.GROUPED,
] as const;

export const TogetherStatusTone = {
  INFO: "info",
  WARNING: "warning",
} as const;

export type TogetherStatusTone =
  (typeof TogetherStatusTone)[keyof typeof TogetherStatusTone];

type TogetherNavRowProps = {
  href: string;
  icon: IconSvgElement;
  iconTone?: IconContainerTone;
  title: string;
  description?: string;
  meta?: string;
  badge?: string;
  appearance?: TogetherNavAppearance;
  testId?: string;
};

function TogetherNavRowBody({
  icon,
  iconTone,
  title,
  description,
  meta,
  badge,
}: Pick<
  TogetherNavRowProps,
  "icon" | "iconTone" | "title" | "description" | "meta" | "badge"
>) {
  return (
    <>
      <IconContainer tone={iconTone} size="sm">
        <AppIcon icon={icon} size="sm" />
      </IconContainer>
      <div className="min-w-0 flex-1">
        <Text size="sm" className="font-semibold text-text-primary">
          {title}
        </Text>
        {description ? (
          <Text size="xs" tone="secondary" className="mt-0.5 text-pretty">
            {description}
          </Text>
        ) : null}
      </div>
      {badge ? (
        <StatusBadge tone="warning" className="shrink-0">
          {badge}
        </StatusBadge>
      ) : meta ? (
        <Text size="xs" tone="secondary" className="shrink-0 font-medium">
          {meta}
        </Text>
      ) : null}
      <AppIcon
        icon={ACTION_ICONS.forward}
        size="sm"
        className="shrink-0 text-text-muted"
        decorative
      />
    </>
  );
}

/** Compact management row for Together destinations and contextual actions. */
export function TogetherNavRow({
  href,
  icon,
  iconTone = "primary",
  title,
  description,
  meta,
  badge,
  appearance = TogetherNavAppearance.CARD,
  testId,
}: TogetherNavRowProps) {
  const body = (
    <TogetherNavRowBody
      icon={icon}
      iconTone={iconTone}
      title={title}
      description={description}
      meta={meta}
      badge={badge}
    />
  );

  if (appearance === TogetherNavAppearance.GROUPED) {
    return (
      <Link
        href={href}
        data-testid={testId}
        className="flex min-h-14 items-center gap-(--space-3) px-(--space-3) py-(--space-3) transition-[background-color] duration-(--duration-fast) hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
      >
        {body}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      data-testid={testId}
      className="block rounded-[var(--radius-card)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      <Card
        tone="interactive"
        className="flex-row items-center gap-(--space-3) p-(--space-3)"
      >
        {body}
      </Card>
    </Link>
  );
}

export function TogetherNavGroup({ children }: { children: ReactNode }) {
  return (
    <Card tone="elevated" className="gap-0 overflow-hidden p-0">
      <div className="divide-y divide-divider">{children}</div>
    </Card>
  );
}

const TOGETHER_PRIMARY_LINK_CLASSNAME =
  "inline-flex min-h-12 w-full items-center justify-center gap-(--space-2) rounded-[var(--radius-control)] bg-accent px-(--space-4) text-sm font-semibold text-accent-fg shadow-(--elevation-1) transition-[background-color,transform,box-shadow] duration-(--duration-fast) hover:-translate-y-px hover:shadow-(--elevation-2) active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

export function TogetherPrimaryLink({
  href,
  testId,
  children,
}: {
  href: string;
  testId?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className={TOGETHER_PRIMARY_LINK_CLASSNAME}
    >
      {children}
    </Link>
  );
}

type TogetherStatusStripProps = {
  children: React.ReactNode;
  tone?: TogetherStatusTone;
  className?: string;
};

/** Quiet contextual strip for lifecycle and capability explanations. */
export function TogetherStatusStrip({
  children,
  tone = TogetherStatusTone.INFO,
  className,
}: TogetherStatusStripProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-(--space-3) rounded-[var(--radius-card)] border px-(--space-3) py-(--space-3)",
        tone === TogetherStatusTone.WARNING
          ? "border-warning/30 bg-warning/10"
          : "border-info/25 bg-info/10",
        className,
      )}
    >
      <AppIcon
        icon={NAVIGATION_ICONS.together}
        size="sm"
        className={cn(
          "mt-0.5 shrink-0",
          tone === TogetherStatusTone.WARNING ? "text-warning" : "text-info",
        )}
        decorative
      />
      <div className="min-w-0 text-sm text-text-primary">{children}</div>
    </div>
  );
}
