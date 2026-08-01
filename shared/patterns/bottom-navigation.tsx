"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Wallet,
  CalendarBlank,
  Tray,
  UsersThree,
} from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import { SafeArea } from "@/providers/safe-area";

const TABS = [
  { href: "/home", label: "Home", icon: House },
  { href: "/money", label: "Money", icon: Wallet },
  { href: "/plan", label: "Plan", icon: CalendarBlank },
  { href: "/inbox", label: "Inbox", icon: Tray },
  { href: "/together", label: "Together", icon: UsersThree },
] as const;

export { TABS };

/**
 * Five IA tabs foundation. Health is not a 6th tab.
 */
export function BottomNavigation({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <SafeArea edges={["bottom"]}>
      <nav
        aria-label="Primary"
        className={cn(
          "sticky bottom-0 z-(--z-nav)border-t border-border-subtle",
          "bg-surface/95 backdrop-blur-sm",
          className,
        )}
      >
        <ul className="grid grid-cols-5 px-(--space-1) pt-(--space-2) pb-(--space-2)">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-md px-1 py-1",
                    "text-[10px] font-medium transition-colors duration-(--duration-fast)",
                    active
                      ? "text-accent"
                      : "text-text-muted hover:text-text-secondary",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    size={24}
                    weight={active ? "fill" : "regular"}
                    aria-hidden
                  />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </SafeArea>
  );
}
