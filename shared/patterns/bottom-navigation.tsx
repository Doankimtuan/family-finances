"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/shared/utils/cn";
import { SafeArea } from "@/providers/safe-area";
import { TABS } from "@/shared/patterns/bottom-navigation-tabs";

export { TABS } from "@/shared/patterns/bottom-navigation-tabs";

/**
 * Five IA tabs foundation. Health is not a 6th tab.
 */
export function BottomNavigation({ className }: { className?: string }) {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const tA11y = useTranslations("a11y");

  return (
    <SafeArea edges={["bottom"]}>
      <nav
        aria-label={tA11y("primaryNav")}
        className={cn(
          "sticky bottom-0 z-(--z-nav) border-t border-border-subtle",
          "bg-surface/95 shadow-[var(--elevation-1)] backdrop-blur-md",
          className,
        )}
      >
        <ul className="grid grid-cols-5 px-(--space-1) pt-(--space-1) pb-(--space-1)">
          {TABS.map(({ href, labelKey, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const label = t(labelKey);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5",
                    "text-[10px] font-medium",
                    "transition-colors duration-(--duration-fast) ease-(--ease-standard)",
                    "motion-reduce:transition-none",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                    active
                      ? "text-accent"
                      : "text-text-muted hover:text-text-secondary",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-accent"
                    />
                  ) : null}
                  <span className="relative inline-flex">
                    <Icon
                      size={24}
                      weight={active ? "fill" : "regular"}
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
                  <span className={cn(active && "font-semibold")}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </SafeArea>
  );
}
