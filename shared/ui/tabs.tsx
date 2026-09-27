"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/utils/cn";
import { handleTabKeyDown } from "./tab-keyboard";

export type TabItem<T extends string = string> = {
  id: T;
  label: ReactNode;
  count?: number | string;
  icon?: ReactNode;
  disabled?: boolean;
};

export type TabsVariant = "capsule" | "underline";

export type TabsProps<T extends string = string> = {
  tabs: readonly TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  variant?: TabsVariant;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
};

/**
 * Canonical ViNha Tabs primitive (Task 11 / Warm Precision).
 * Navigates distinct views with Capsule or Underline indicators,
 * count badge integration, and 44px standard height.
 */
export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  variant = "capsule",
  disabled = false,
  className,
  "data-testid": testId,
}: TabsProps<T>) {
  const tA11y = useTranslations("a11y");
  return (
    <div
      role="tablist"
      aria-label={tA11y("viewTabs")}
      data-testid={testId}
      className={cn(
        "flex h-11 min-h-11 w-full items-center select-none",
        variant === "underline"
          ? "border-b border-border-subtle gap-6 px-1"
          : "rounded-[var(--radius-control)] bg-surface-subtle p-1 gap-1 border border-border-subtle/40",
        disabled && "opacity-45 pointer-events-none cursor-not-allowed",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isTabDisabled = disabled || tab.disabled;

        if (variant === "underline") {
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-tab-id={tab.id}
              tabIndex={isActive ? 0 : -1}
              aria-selected={isActive}
              disabled={isTabDisabled}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) =>
                handleTabKeyDown(event, tabs, disabled, onChange)
              }
              className={cn(
                "relative flex h-full items-center gap-2 pb-2 pt-1 text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                isActive
                  ? "text-primary font-semibold"
                  : "text-text-secondary hover:text-text-primary",
                isTabDisabled && "cursor-not-allowed opacity-45",
              )}
            >
              {tab.icon ? (
                <span className="flex shrink-0">{tab.icon}</span>
              ) : null}
              <span>{tab.label}</span>
              {tab.count !== undefined ? (
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                    isActive
                      ? "bg-primary text-primary-fg"
                      : "bg-surface-soft text-text-muted",
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
              {isActive ? (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
              ) : null}
            </button>
          );
        }

        // Capsule Variant
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            data-tab-id={tab.id}
            tabIndex={isActive ? 0 : -1}
            aria-selected={isActive}
            disabled={isTabDisabled}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) =>
              handleTabKeyDown(event, tabs, disabled, onChange)
            }
            className={cn(
              "relative flex h-9 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] px-3 text-xs font-medium transition-[background-color,color,box-shadow]",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring",
              isActive
                ? "bg-surface text-text-primary font-semibold shadow-xs"
                : "text-text-secondary hover:text-text-primary",
              isTabDisabled && "cursor-not-allowed opacity-45",
            )}
          >
            {tab.icon ? (
              <span className="flex shrink-0">{tab.icon}</span>
            ) : null}
            <span className="truncate">{tab.label}</span>
            {tab.count !== undefined ? (
              <span
                className={cn(
                  "inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                  isActive
                    ? "bg-primary text-primary-fg"
                    : "bg-surface-soft text-text-muted",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
