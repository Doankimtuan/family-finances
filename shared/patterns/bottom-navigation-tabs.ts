import type { IconSvgElement } from "@hugeicons/react";
import { NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { APP_PATH } from "@/modules/shared-kernel/app-path";

export type NavTab = {
  href:
    | typeof APP_PATH.HOME
    | typeof APP_PATH.MONEY
    | typeof APP_PATH.PLAN
    | typeof APP_PATH.INBOX
    | typeof APP_PATH.TOGETHER;
  labelKey: "home" | "money" | "plan" | "inbox" | "together";
  icon: IconSvgElement;
};

/** Five IA tabs — Health is not included. */
export const TABS: readonly NavTab[] = [
  { href: APP_PATH.HOME, labelKey: "home", icon: NAVIGATION_ICONS.home },
  { href: APP_PATH.MONEY, labelKey: "money", icon: NAVIGATION_ICONS.money },
  { href: APP_PATH.PLAN, labelKey: "plan", icon: NAVIGATION_ICONS.plan },
  { href: APP_PATH.INBOX, labelKey: "inbox", icon: NAVIGATION_ICONS.inbox },
  {
    href: APP_PATH.TOGETHER,
    labelKey: "together",
    icon: NAVIGATION_ICONS.together,
  },
] as const;
