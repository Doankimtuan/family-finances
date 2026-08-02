"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Desktop, Moon, Sun } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

const THEME_OPTION_ICON_SIZE = 16;

const OPTIONS = [
  { value: "system", icon: Desktop, labelKey: "themeSystem" as const },
  { value: "light", icon: Sun, labelKey: "themeLight" as const },
  { value: "dark", icon: Moon, labelKey: "themeDark" as const },
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
        "grid w-full grid-cols-3 gap-(--space-1) rounded-lg",
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
              "rounded-md px-(--space-1) py-(--space-2)",
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
            <Icon
              size={THEME_OPTION_ICON_SIZE}
              weight={isActive ? "fill" : "regular"}
              aria-hidden
            />
            <span className="max-w-full truncate">{t(labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
