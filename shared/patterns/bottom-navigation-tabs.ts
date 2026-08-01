import {
  House,
  Wallet,
  CalendarBlank,
  Tray,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";

export type NavTab = {
  href: "/home" | "/money" | "/plan" | "/inbox" | "/together";
  labelKey: "home" | "money" | "plan" | "inbox" | "together";
  icon: Icon;
};

/** Five IA tabs — Health is not included. */
export const TABS: readonly NavTab[] = [
  { href: "/home", labelKey: "home", icon: House },
  { href: "/money", labelKey: "money", icon: Wallet },
  { href: "/plan", labelKey: "plan", icon: CalendarBlank },
  { href: "/inbox", labelKey: "inbox", icon: Tray },
  { href: "/together", labelKey: "together", icon: UsersThree },
] as const;
