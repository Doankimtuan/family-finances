"use client";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { cn } from "@/shared/utils/cn";
import { SafeArea } from "@/providers/safe-area";
import { TABS } from "@/shared/patterns/bottom-navigation-tabs";
import { AppIcon } from "@/shared/ui/app-icon";

export { TABS } from "@/shared/patterns/bottom-navigation-tabs";
const NAV_TAB_COUNT = TABS.length;

export type BottomNavigationProps = {
  className?: string;
  inboxCount?: number;
};

/**
 * Five-destination product navigation. The shell owns its vertical space and
 * this component owns only navigation semantics, labels, and selection state.
 */
export function BottomNavigation({
  className,
  inboxCount,
}: BottomNavigationProps) {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const tA11y = useTranslations("a11y");
  return (
    <SafeArea edges={["bottom"]} className="shrink-0">
      <nav
        aria-label={tA11y("primaryNav")}
        className={cn(
          "z-(--z-nav) border-t border-border-subtle/60 bg-canvas/95",
          "min-[481px]:m-(--space-2) min-[481px]:rounded-[var(--radius-xl)] min-[481px]:border",
          "min-[481px]:bg-surface/90 min-[481px]:shadow-[var(--elevation-1)]",
          className,
        )}
      >
        <ul
          className="grid gap-(--space-1) px-(--space-2) py-(--space-2)"
          style={{
            gridTemplateColumns: `repeat(${NAV_TAB_COUNT}, minmax(0, 1fr))`,
          }}
        >
          {TABS.map(({ href, labelKey, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const label = t(labelKey);
            const isInbox = href === APP_PATH.INBOX;
            const showBadge =
              isInbox && inboxCount !== undefined && inboxCount > 0;
            return (
              <li key={href} className="min-w-0">
                <Link
                  href={href}
                  className={cn(
                    "relative flex min-h-14 min-w-0 flex-col items-center justify-center",
                    "gap-(--space-1) rounded-[var(--radius-lg)] px-(--space-1) py-(--space-2)",
                    "text-center text-xs font-medium leading-tight tracking-tight",
                    "transition-[color,background-color,transform] duration-(--duration-fast) ease-(--ease-standard)",
                    "motion-reduce:transition-none",
                    "active:scale-[var(--press-scale)] motion-reduce:active:scale-100",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-text-muted hover:bg-surface-hover/70 hover:text-text-secondary",
                  )}
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : "false"}
                >
                  <span className="relative inline-flex shrink-0">
                    <AppIcon icon={Icon} size="lg" emphasized={active} />
                    {showBadge ? (
                      <span
                        data-testid="inbox-badge"
                        data-slot="nav-tab-badge"
                        className="pointer-events-none absolute -top-0.5 -end-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-accent px-1 py-0.5 text-[10px] font-bold text-accent-fg shadow-sm ring-2 ring-surface"
                        aria-label={tA11y("inboxBadge", { count: inboxCount })}
                      >
                        {inboxCount}
                      </span>
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
