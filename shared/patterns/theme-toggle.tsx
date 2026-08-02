"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Desktop, Moon, Sun } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

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
        "inline-flex w-full items-stretch gap-1 rounded-[var(--radius-lg)]",
        "border border-border-subtle bg-surface p-1",
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
              "inline-flex min-h-10 flex-1 items-center justify-center gap-1.5",
              "rounded-[var(--radius-md)] px-2 text-sm font-medium",
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
              size={16}
              weight={isActive ? "fill" : "regular"}
              aria-hidden
            />
            <span>{t(labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
