import type { IconSvgElement } from "@hugeicons/react";
import { BOTTOM_NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { APP_PATH } from "@/modules/shared-kernel/app-path";

export type NavTab = {
  href:
    | typeof APP_PATH.HOME
    | typeof APP_PATH.MONEY
    | typeof APP_PATH.PLAN
    | typeof APP_PATH.INBOX;
  labelKey: "home" | "money" | "plan" | "inbox";
  icon: IconSvgElement;
};

/** Four primary route tabs; transaction capture occupies the center slot. */
export const TABS: readonly NavTab[] = [
  {
    href: APP_PATH.HOME,
    labelKey: "home",
    icon: BOTTOM_NAVIGATION_ICONS.home,
  },
  {
    href: APP_PATH.MONEY,
    labelKey: "money",
    icon: BOTTOM_NAVIGATION_ICONS.money,
  },
  {
    href: APP_PATH.PLAN,
    labelKey: "plan",
    icon: BOTTOM_NAVIGATION_ICONS.plan,
  },
  {
    href: APP_PATH.INBOX,
    labelKey: "inbox",
    icon: BOTTOM_NAVIGATION_ICONS.inbox,
  },
] as const;
