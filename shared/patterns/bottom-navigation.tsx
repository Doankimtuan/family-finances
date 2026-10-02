"use client";
import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useLinkStatus } from "next/link";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { INBOX_BADGE_MAX_DISPLAY_COUNT } from "@/modules/inbox/application/inbox-constants";
import { APP_PATH, APP_PATH_SEGMENT } from "@/modules/shared-kernel/app-path";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { motionTokens, springs, useMotionPolicy } from "@/shared/motion";
import { cn } from "@/shared/utils/cn";
import { SafeArea } from "@/providers/safe-area";
import { TABS, type NavTab } from "@/shared/patterns/bottom-navigation-tabs";
import { FloatingActionButton } from "@/shared/patterns/floating-action";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";

export { TABS } from "@/shared/patterns/bottom-navigation-tabs";
const NAV_ITEM_COUNT = TABS.length + 1;
type ProductTabPath = NavTab["href"];
const TRANSACTION_ACTION_SEGMENTS = new Set<string>([
  APP_PATH_SEGMENT.EDIT,
  APP_PATH_SEGMENT.CORRECT,
  APP_PATH_SEGMENT.REFUND,
]);

const STANDALONE_FLOW_PATHS = new Set<string>([
  APP_PATH.MONEY_ADD,
  APP_PATH.PLAN_RITUAL,
  APP_PATH.MONEY_SAVINGS_NEW,
  APP_PATH.MONEY_SAVINGS_PROVIDERS_NEW,
  APP_PATH.MONEY_INVESTMENTS_NEW,
  APP_PATH.INVITATIONS_NEW,
]);

const CONTEXTUAL_CREATE_ACTION_PATHS = new Set<string>([
  APP_PATH.MONEY_SAVINGS,
  APP_PATH.MONEY_INVESTMENTS,
  APP_PATH.MONEY_INVESTMENTS_OVERVIEW,
  APP_PATH.MONEY_DEBTS,
  APP_PATH.MONEY_LOANS,
]);

export function isStandaloneFlowPath(pathname: string): boolean {
  if (STANDALONE_FLOW_PATHS.has(pathname)) return true;
  if (
    pathname.startsWith(`${APP_PATH.MONEY_TRANSACTIONS}/`) &&
    TRANSACTION_ACTION_SEGMENTS.has(pathname.split("/").at(-1) ?? "")
  ) {
    return true;
  }
  return false;
}

export function isPathInTab(pathname: string, href: ProductTabPath): boolean {
  if (
    href === APP_PATH.HOME &&
    (pathname === APP_PATH.HEALTH || pathname.startsWith(`${APP_PATH.HEALTH}/`))
  ) {
    return true;
  }
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

function formatInboxBadgeCount(count: number): number | string {
  return count > INBOX_BADGE_MAX_DISPLAY_COUNT
    ? `${INBOX_BADGE_MAX_DISPLAY_COUNT}+`
    : count;
}

export type BottomNavigationProps = {
  className?: string;
  inboxCount?: number;
};

/** Four route tabs and a centered transaction-capture action. */
export function BottomNavigation({
  className,
  inboxCount,
}: BottomNavigationProps) {
  const pathname = usePathname();

  if (isStandaloneFlowPath(pathname)) {
    return null;
  }

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
  const router = useRouter();
  const { online } = useOnlineStatusClient();
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

  const renderTab = ({ href, labelKey, icon }: NavTab) => {
    const committedActive = isPathInTab(pathname, href);
    const pendingIsUncommitted =
      pendingDestination !== null && !isPathInTab(pathname, pendingDestination);
    const active = pendingIsUncommitted
      ? pendingDestination === href
      : committedActive;
    const label = t(labelKey);
    const badgeCount = inboxCount ?? 0;
    const showBadge = href === APP_PATH.INBOX && badgeCount > 0;
    const badgeLabel = showBadge ? formatInboxBadgeCount(badgeCount) : null;

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
            "gap-(--space-1) rounded-[var(--radius-control)] px-(--space-1) py-(--space-1)",
            "text-center text-label-sm font-medium leading-tight tracking-tight",
            "transition-[color,font-weight] duration-(--duration-normal) ease-(--ease-standard)",
            "motion-reduce:transition-none",
            "active:scale-[var(--press-scale)] motion-reduce:active:scale-100",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
            active
              ? "font-semibold text-primary"
              : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
          )}
          aria-current={committedActive ? "page" : undefined}
          data-active={active ? "true" : "false"}
        >
          <NavigationPendingFeedback
            href={href}
            onSettled={handleNavigationSettled}
          />
          <span className="relative z-10 inline-flex shrink-0">
            <TabIcon icon={icon} active={active} animated={motionEnabled} />
            {showBadge ? (
              <span
                data-testid="inbox-badge"
                data-slot="nav-tab-badge"
                aria-hidden="true"
                className="pointer-events-none absolute -top-1 -end-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-warning px-(--space-1) py-px text-label-sm font-semibold leading-none text-inverse-fg ring-2 ring-surface-elevated tabular-nums"
              >
                {badgeLabel}
              </span>
            ) : null}
          </span>
          <span className="relative z-10 max-w-full whitespace-nowrap">
            {label}
            {active ? (
              <span
                data-slot="nav-tab-active-dot"
                aria-hidden="true"
                className="ms-(--space-1) inline-block size-(--space-1) rounded-full bg-current align-middle"
              />
            ) : null}
          </span>
          {showBadge ? (
            <span className="sr-only">
              {tA11y("inboxBadge", { count: badgeCount })}
            </span>
          ) : null}
        </Link>
      </li>
    );
  };
  const hasContextualCreateAction =
    CONTEXTUAL_CREATE_ACTION_PATHS.has(pathname);
  const centerIndex = TABS.length / 2;

  return (
    <SafeArea edges={["bottom"]} className="shrink-0">
      <div className="pt-(--space-2)">
        <nav
          aria-label={tA11y("primaryNav")}
          data-slot="bottom-navigation"
          className={cn(
            "z-(--z-nav) border-t border-divider bg-surface-elevated",
            "min-h-[calc(var(--bottom-navigation-height)-var(--space-2))] px-(--space-2) py-(--space-1)",
            className,
          )}
        >
          <ul
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${NAV_ITEM_COUNT}, minmax(0, 1fr))`,
            }}
          >
            {TABS.slice(0, centerIndex).map(renderTab)}
            <li key={APP_PATH.MONEY_ADD} className="relative min-h-14 min-w-0">
              {hasContextualCreateAction ? null : (
                <>
                  <FloatingActionButton
                    aria-label={t(
                      online ? "addTransaction" : "offlineAddTransaction",
                    )}
                    isDisabled={!online}
                    isIconOnly
                    leadingIcon={
                      <AppIcon icon={ACTION_ICONS.add} size={AppIconSize.MD} />
                    }
                    className={cn(
                      "absolute -top-(--space-3) left-1/2 z-20 size-(--space-12)",
                      "min-h-(--space-12) min-w-(--space-12) -translate-x-1/2 rounded-(--radius-overlay)",
                      "border-2 border-surface-elevated p-0 ring-4 ring-primary-soft shadow-(--elevation-2)",
                    )}
                    data-testid="money-capture"
                    onPress={() => router.push(APP_PATH.MONEY_ADD)}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 z-10 whitespace-nowrap text-center text-label-sm font-semibold leading-tight text-primary"
                  >
                    {t("record")}
                  </span>
                </>
              )}
            </li>
            {TABS.slice(centerIndex).map(renderTab)}
          </ul>
        </nav>
      </div>
    </SafeArea>
  );
}
