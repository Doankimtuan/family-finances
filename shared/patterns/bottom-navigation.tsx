"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/shared/utils/cn";
import { SafeArea } from "@/providers/safe-area";
import { TABS } from "@/shared/patterns/bottom-navigation-tabs";

export { TABS } from "@/shared/patterns/bottom-navigation-tabs";

const NAV_TAB_ICON_SIZE = 22;
const NAV_TAB_COUNT = TABS.length;

/**
 * Five IA tabs foundation. Health is not a 6th tab.
 * Soft dock: canvas blur + accent wash on the active tab (no top hairline).
 */
export function BottomNavigation({ className }: { className?: string }) {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const tA11y = useTranslations("a11y");

  return (
    <SafeArea edges={["bottom"]} className="shrink-0">
      <nav
        aria-label={tA11y("primaryNav")}
        className={cn(
          "z-(--z-nav)",
          "border-t border-border-subtle/50",
          "backdrop-blur-xl",
          "[background-color:color-mix(in_srgb,var(--color-canvas)_calc(var(--opacity-nav-chrome)*100%),transparent)]",
          "shadow-[inset_0_1px_0_0_color-mix(in_srgb,var(--color-text-primary)_calc(var(--opacity-nav-highlight)*100%),transparent)]",
          className,
        )}
      >
        <ul
          className="grid gap-(--space-1) px-(--space-2) pt-(--space-2) pb-(--space-2)"
          style={{
            gridTemplateColumns: `repeat(${NAV_TAB_COUNT}, minmax(0, 1fr))`,
          }}
        >
          {TABS.map(({ href, labelKey, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const label = t(labelKey);
            return (
              <li key={href} className="min-w-0">
                <Link
                  href={href}
                  className={cn(
                    "relative flex min-h-12 min-w-0 flex-col items-center justify-center",
                    "gap-(--space-1) rounded-[var(--radius-lg)] px-(--space-1) py-(--space-2)",
                    "text-center text-xs font-medium leading-tight tracking-tight",
                    "transition-[color,background-color,transform] duration-(--duration-fast) ease-(--ease-standard)",
                    "motion-reduce:transition-none",
                    "active:scale-[var(--press-scale)] motion-reduce:active:scale-100",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                    active
                      ? "[background-color:color-mix(in_srgb,var(--color-accent)_calc(var(--opacity-accent-wash)*100%),transparent)] text-accent"
                      : "text-text-muted hover:bg-surface-hover/70 hover:text-text-secondary",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="relative inline-flex shrink-0">
                    <Icon
                      size={NAV_TAB_ICON_SIZE}
                      weight={active ? "fill" : "duotone"}
                      aria-hidden
                    />
                    {labelKey === "inbox" ? (
                      <span
                        data-testid="inbox-badge-placeholder"
                        data-slot="nav-tab-badge"
                        className="pointer-events-none absolute -top-0.5 -end-1.5 size-2 rounded-full bg-accent opacity-0"
                        aria-hidden
                      />
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "max-w-full text-balance",
                      active && "font-semibold",
                    )}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </SafeArea>
  );
}
