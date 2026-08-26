"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import {
  ComputerIcon,
  Moon02Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";
import { AppIcon } from "@/shared/ui/app-icon";
import { cn } from "@/shared/utils/cn";
import { useTheme } from "@/providers/theme-provider";

const OPTIONS = [
  { value: "system", icon: ComputerIcon, labelKey: "themeSystem" as const },
  { value: "light", icon: Sun03Icon, labelKey: "themeLight" as const },
  { value: "dark", icon: Moon02Icon, labelKey: "themeDark" as const },
] as const;

/** SSR-safe client flag — avoids setState-in-effect hydration gates. */
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/**
 * System / Light / Dark segmented control.
 * Icon-above-label so longer locales (e.g. VI "Hệ thống") never overflow the shell.
 * Hydration-safe: inert until client snapshot so SSR and first paint match.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("settings");
  const tA11y = useTranslations("a11y");
  const { theme, setTheme } = useTheme();
  const mounted = useIsClient();

  const active = mounted ? (theme ?? "system") : "system";

  return (
    <div
      role="group"
      aria-label={tA11y("themeSwitcher")}
      aria-busy={!mounted}
      className={cn(
        "grid w-full grid-cols-3 gap-(--space-1) rounded-(--radius-control)",
        "border border-border-subtle bg-surface p-(--space-1)",
        className,
      )}
    >
      {OPTIONS.map(({ value, icon: Icon, labelKey }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            disabled={!mounted}
            className={cn(
              "flex min-h-11 min-w-0 flex-col items-center justify-center gap-(--space-1)",
              "rounded-(--radius-control) px-(--space-1) py-(--space-2)",
              "text-center text-xs font-medium leading-tight tracking-tight",
              "transition-colors duration-(--duration-fast) ease-(--ease-standard)",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
              "disabled:cursor-default disabled:opacity-(--opacity-disabled)",
              isActive
                ? "bg-accent text-accent-fg shadow-[var(--elevation-1)]"
                : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
            )}
            aria-pressed={isActive}
            onClick={() => setTheme(value)}
          >
            <AppIcon icon={Icon} size="xs" emphasized={isActive} />
            <span className="max-w-full truncate">{t(labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
