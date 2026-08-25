import type { IconSvgElement } from "@hugeicons/react";
import { Link } from "@/i18n/navigation";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  IconContainer,
  type IconContainerTone,
} from "@/shared/ui/icon-container";
import { ACTION_ICONS, NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";
import { Card } from "./card";

type TogetherNavRowProps = {
  href: string;
  icon: IconSvgElement;
  iconTone?: IconContainerTone;
  title: string;
  description?: string;
  meta?: string;
  testId?: string;
};

/** Compact management row for Together destinations and contextual actions. */
export function TogetherNavRow({
  href,
  icon,
  iconTone = "primary",
  title,
  description,
  meta,
  testId,
}: TogetherNavRowProps) {
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
        {meta ? (
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
      </Card>
    </Link>
  );
}

type TogetherStatusStripProps = {
  children: React.ReactNode;
  tone?: "info" | "warning";
  className?: string;
};

/** Quiet contextual strip for lifecycle and capability explanations. */
export function TogetherStatusStrip({
  children,
  tone = "info",
  className,
}: TogetherStatusStripProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-(--space-3) rounded-[var(--radius-card)] border px-(--space-3) py-(--space-3)",
        tone === "warning"
          ? "border-warning/30 bg-warning/10 text-warning"
          : "border-info/25 bg-info/10 text-info",
        className,
      )}
    >
      <AppIcon
        icon={NAVIGATION_ICONS.together}
        size="sm"
        className="mt-0.5 shrink-0"
        decorative
      />
      <div className="min-w-0 text-sm text-text-primary">{children}</div>
    </div>
  );
}
