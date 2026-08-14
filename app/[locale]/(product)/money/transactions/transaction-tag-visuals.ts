import {
  Airplane01Icon,
  Bookmark03Icon,
  Briefcase05Icon,
  Coffee01Icon,
  GiftIcon,
  GraduationCapIcon,
  HealthIcon,
  Home01Icon,
  ShoppingBag01Icon,
  StarIcon,
  Ticket01Icon,
  UserGroupIcon,
  Car01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { TransactionTag } from "@/modules/ledger/application/client";
import {
  TransactionTagColorKey,
  TransactionTagIconKey,
  DEFAULT_TRANSACTION_TAG_COLOR_KEY,
  DEFAULT_TRANSACTION_TAG_ICON_KEY,
} from "@/modules/ledger/application/client";

export const TRANSACTION_TAG_ICONS: Record<
  TransactionTagIconKey,
  IconSvgElement
> = {
  [TransactionTagIconKey.BRIEFCASE]: Briefcase05Icon,
  [TransactionTagIconKey.BOOKMARK]: Bookmark03Icon,
  [TransactionTagIconKey.EDUCATION]: GraduationCapIcon,
  [TransactionTagIconKey.FAMILY]: UserGroupIcon,
  [TransactionTagIconKey.FOOD]: Coffee01Icon,
  [TransactionTagIconKey.GIFT]: GiftIcon,
  [TransactionTagIconKey.HEALTH]: HealthIcon,
  [TransactionTagIconKey.HOME]: Home01Icon,
  [TransactionTagIconKey.SHOPPING]: ShoppingBag01Icon,
  [TransactionTagIconKey.STAR]: StarIcon,
  [TransactionTagIconKey.SUBSCRIPTION]: Ticket01Icon,
  [TransactionTagIconKey.TRANSPORT]: Car01Icon,
  [TransactionTagIconKey.TRAVEL]: Airplane01Icon,
  [TransactionTagIconKey.WORK]: Briefcase05Icon,
} as const;

export const TRANSACTION_TAG_COLORS: Record<
  TransactionTagColorKey,
  {
    surface: string;
    border: string;
    text: string;
    swatch: string;
  }
> = {
  [TransactionTagColorKey.AMBER]: {
    surface: "bg-warning/10",
    border: "border-warning/30",
    text: "text-warning",
    swatch: "bg-warning/35",
  },
  [TransactionTagColorKey.BLUE]: {
    surface: "bg-info/10",
    border: "border-info/30",
    text: "text-info",
    swatch: "bg-info/35",
  },
  [TransactionTagColorKey.EMERALD]: {
    surface: "bg-success/10",
    border: "border-success/30",
    text: "text-success",
    swatch: "bg-success/35",
  },
  [TransactionTagColorKey.ROSE]: {
    surface: "bg-danger/10",
    border: "border-danger/30",
    text: "text-danger",
    swatch: "bg-danger/35",
  },
  [TransactionTagColorKey.SLATE]: {
    surface: "bg-surface-muted",
    border: "border-border-subtle",
    text: "text-text-secondary",
    swatch: "bg-text-secondary/35",
  },
  [TransactionTagColorKey.VIOLET]: {
    surface: "bg-investment-soft",
    border: "border-investment/30",
    text: "text-investment",
    swatch: "bg-investment/35",
  },
} as const;

export function transactionTagVisualFor(
  tag: Pick<TransactionTag, "iconKey" | "colorKey">,
) {
  return {
    icon:
      TRANSACTION_TAG_ICONS[tag.iconKey] ??
      TRANSACTION_TAG_ICONS[DEFAULT_TRANSACTION_TAG_ICON_KEY],
    color:
      TRANSACTION_TAG_COLORS[
        tag.colorKey ?? DEFAULT_TRANSACTION_TAG_COLOR_KEY
      ] ?? TRANSACTION_TAG_COLORS[DEFAULT_TRANSACTION_TAG_COLOR_KEY],
  };
}
