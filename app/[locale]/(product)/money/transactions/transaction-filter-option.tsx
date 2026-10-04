"use client";

import type { ReactNode } from "react";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { cn } from "@/shared/utils/cn";

export function TransactionFilterOption({
  label,
  icon,
  status,
  selected,
  isDisabled,
  onPress,
  testId,
}: {
  label: string;
  icon: ReactNode;
  status?: string;
  selected: boolean;
  isDisabled?: boolean;
  onPress: () => void;
  testId: string;
}) {
  return (
    <Button
      type="button"
      variant={ButtonVariant.GHOST}
      aria-pressed={selected}
      isDisabled={isDisabled}
      onPress={onPress}
      data-testid={testId}
      className={cn(
        "h-auto min-h-12 w-full justify-start gap-(--space-3) rounded-(--radius-control) border px-(--space-3) py-(--space-2) text-left",
        selected
          ? "border-primary/40 bg-primary-soft hover:bg-primary-soft"
          : "border-border-subtle bg-surface hover:bg-surface-hover",
      )}
    >
      {icon}
      <span className="flex min-w-0 flex-1 flex-col gap-(--space-1)">
        <span className="truncate text-sm font-medium text-text-primary">
          {label}
        </span>
        {status ? (
          <span className="text-xs font-normal text-text-secondary">
            {status}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-(--radius-xs) border",
          selected
            ? "border-primary bg-primary text-primary-fg"
            : "border-border-strong bg-transparent",
        )}
      >
        {selected ? <AppIcon icon={ACTION_ICONS.check} size="xs" /> : null}
      </span>
    </Button>
  );
}
