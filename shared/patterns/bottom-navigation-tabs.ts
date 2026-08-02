import {
  House,
  Wallet,
  CalendarBlank,
  Tray,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

export type NavTab = {
  href:
    | typeof APP_PATH.HOME
    | typeof APP_PATH.MONEY
    | typeof APP_PATH.PLAN
    | typeof APP_PATH.INBOX
    | typeof APP_PATH.TOGETHER;
  labelKey: "home" | "money" | "plan" | "inbox" | "together";
  icon: Icon;
};

/** Five IA tabs — Health is not included. */
export const TABS: readonly NavTab[] = [
  { href: APP_PATH.HOME, labelKey: "home", icon: House },
  { href: APP_PATH.MONEY, labelKey: "money", icon: Wallet },
  { href: APP_PATH.PLAN, labelKey: "plan", icon: CalendarBlank },
  { href: APP_PATH.INBOX, labelKey: "inbox", icon: Tray },
  { href: APP_PATH.TOGETHER, labelKey: "together", icon: UsersThree },
] as const;
