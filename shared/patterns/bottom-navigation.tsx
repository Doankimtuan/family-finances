"use client";
import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useLinkStatus } from "next/link";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/shared-kernel/app-path";
import {
  NAVIGATION_ANIMATION_ID,
  PRODUCT_LINK_PREFETCH,
} from "@/shared/constants/navigation";
import { motionTokens, springs, useMotionPolicy } from "@/shared/motion";
import { cn } from "@/shared/utils/cn";
import { SafeArea } from "@/providers/safe-area";
import { TABS, type NavTab } from "@/shared/patterns/bottom-navigation-tabs";
import { AppIcon } from "@/shared/ui/app-icon";

export { TABS } from "@/shared/patterns/bottom-navigation-tabs";
const NAV_TAB_COUNT = TABS.length;
type ProductTabPath = NavTab["href"];

function isPathInTab(pathname: string, href: ProductTabPath): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isNormalPrimaryClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  const target = event.currentTarget.target;
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    (!target || target === "_self") &&
    !event.currentTarget.hasAttribute("download")
  );
}

function ActiveTabIndicator({
  active,
  animated,
}: {
  active: boolean;
  animated: boolean;
}) {
  if (!active) return null;

  const className =
    "pointer-events-none absolute inset-0 rounded-[var(--radius-control)] bg-primary-soft";

  return animated ? (
    <motion.span
      layoutId={NAVIGATION_ANIMATION_ID.ACTIVE_PRODUCT_TAB}
      className={className}
      transition={springs.snappy}
      data-slot="nav-tab-active-indicator"
      aria-hidden="true"
    />
  ) : (
    <span
      className={className}
      data-slot="nav-tab-active-indicator"
      aria-hidden="true"
    />
  );
}

function TabIcon({
  icon,
  active,
  animated,
}: {
  icon: NavTab["icon"];
  active: boolean;
  animated: boolean;
}) {
  const content = <AppIcon icon={icon} size="lg" emphasized={active} />;

  return animated ? (
    <motion.span
      className="relative inline-flex shrink-0"
      animate={{ scale: active ? motionTokens.scale.pop : 1 }}
      transition={springs.snappy}
      aria-hidden="true"
    >
      {content}
    </motion.span>
  ) : (
    <span className="relative inline-flex shrink-0" aria-hidden="true">
      {content}
    </span>
  );
}

function NavigationPendingFeedback({
  href,
  onSettled,
}: {
  href: ProductTabPath;
  onSettled: (href: ProductTabPath) => void;
}) {
  const { pending } = useLinkStatus();
  const sawPending = useRef(false);

  useEffect(() => {
    if (pending) {
      sawPending.current = true;
      return;
    }

    if (sawPending.current) {
      sawPending.current = false;
      onSettled(href);
    }
  }, [href, onSettled, pending]);

  return (
    <span
      data-slot="nav-tab-pending-indicator"
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-(--space-3) top-1 z-20 h-0.5 rounded-full bg-primary",
        "transition-opacity duration-(--duration-fast) ease-(--ease-standard)",
        "motion-reduce:transition-none",
        pending ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

export type BottomNavigationProps = {
  className?: string;
  inboxCount?: number;
};

/**
 * Five-destination product navigation. Attached chrome — not a floating pill
 * container. Active state uses surface, weight, emphasized stroke, and
 * `aria-current`; never color alone.
 */
export function BottomNavigation({
  className,
  inboxCount,
}: BottomNavigationProps) {
  const pathname = usePathname();

  return (
    <BottomNavigationContent
      pathname={pathname}
      className={className}
      inboxCount={inboxCount}
    />
  );
}

function BottomNavigationContent({
  className,
  inboxCount,
  pathname,
}: BottomNavigationProps & { pathname: string }) {
  const t = useTranslations("navigation");
  const tA11y = useTranslations("a11y");
  const { enabled: motionEnabled } = useMotionPolicy();
  const [pendingDestination, setPendingDestination] =
    useState<ProductTabPath | null>(null);

  useEffect(() => {
    const clearPendingDestination = () => setPendingDestination(null);
    window.addEventListener("popstate", clearPendingDestination);
    return () =>
      window.removeEventListener("popstate", clearPendingDestination);
  }, []);

  const handleNavigationSettled = (href: ProductTabPath) => {
    setPendingDestination((current) => (current === href ? null : current));
  };

  return (
    <SafeArea edges={["bottom"]} className="shrink-0">
      <nav
        aria-label={tA11y("primaryNav")}
        data-slot="bottom-navigation"
        className={cn(
          "z-(--z-nav) border-t border-divider bg-canvas/95 backdrop-blur-md",
          "min-h-(--bottom-navigation-height)",
          className,
        )}
      >
        <ul
          className="grid gap-(--space-1) px-(--space-2) py-(--space-2)"
          style={{
            gridTemplateColumns: `repeat(${NAV_TAB_COUNT}, minmax(0, 1fr))`,
          }}
        >
          {TABS.map(({ href, labelKey, icon }) => {
            const committedActive = isPathInTab(pathname, href);
            const pendingIsUncommitted =
              pendingDestination !== null &&
              !isPathInTab(pathname, pendingDestination);
            const active = pendingIsUncommitted
              ? pendingDestination === href
              : committedActive;
            const label = t(labelKey);
            const isInbox = href === APP_PATH.INBOX;
            const showBadge =
              isInbox && inboxCount !== undefined && inboxCount > 0;
            return (
              <li key={href} className="min-w-0">
                <Link
                  href={href}
                  prefetch={PRODUCT_LINK_PREFETCH}
                  onClick={(event) => {
                    if (!isNormalPrimaryClick(event)) return;
                    if (committedActive) {
                      event.preventDefault();
                      setPendingDestination(null);
                      return;
                    }
                    if (pendingDestination === href) {
                      event.preventDefault();
                      return;
                    }
                    setPendingDestination(href);
                  }}
                  className={cn(
                    "relative flex min-h-14 min-w-0 flex-col items-center justify-center",
                    "gap-(--space-1) rounded-[var(--radius-control)] px-(--space-1) py-(--space-2)",
                    "text-center text-xs font-medium leading-tight tracking-tight",
                    "transition-[color,font-weight] duration-(--duration-normal) ease-(--ease-standard)",
                    "motion-reduce:transition-none",
                    "active:scale-[var(--press-scale)] motion-reduce:active:scale-100",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                    active
                      ? "font-semibold text-primary"
                      : "text-text-muted hover:bg-surface-hover/70 hover:text-text-secondary",
                  )}
                  aria-current={committedActive ? "page" : undefined}
                  data-active={active ? "true" : "false"}
                >
                  <ActiveTabIndicator
                    active={active}
                    animated={motionEnabled}
                  />
                  <NavigationPendingFeedback
                    href={href}
                    onSettled={handleNavigationSettled}
                  />
                  <span className="relative z-10 inline-flex shrink-0">
                    <TabIcon
                      icon={icon}
                      active={active}
                      animated={motionEnabled}
                    />
                    {showBadge ? (
                      <span
                        data-testid="inbox-badge"
                        data-slot="nav-tab-badge"
                        className="pointer-events-none absolute -top-0.5 -end-1.5 flex min-w-5 items-center justify-center rounded-full bg-accent px-(--space-1) py-px text-xs font-bold leading-none text-accent-fg ring-2 ring-canvas"
                        aria-label={tA11y("inboxBadge", { count: inboxCount })}
                      >
                        {inboxCount}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "relative z-10 max-w-full text-balance transition-opacity duration-(--duration-normal)",
                      "motion-reduce:transition-none",
                      active ? "opacity-100" : "opacity-(--opacity-muted)",
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
