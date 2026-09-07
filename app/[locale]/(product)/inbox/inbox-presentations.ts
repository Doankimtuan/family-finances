import type { IconSvgElement } from "@hugeicons/react";
import {
  InboxItemKind,
  InboxKindFilter,
  InboxLifecycleContext,
} from "@/modules/inbox/application/inbox-constants";
import { IconContainerTone } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadgeTone } from "@/shared/ui/status-badge";

export type InboxItemVisual = {
  icon: IconSvgElement;
  tone: IconContainerTone;
  statusTone: StatusBadgeTone;
};

export type InboxKindFilterId = typeof InboxKindFilter.ALL | InboxItemKind;

const ITEM_VISUALS: Record<InboxItemKind, InboxItemVisual> = {
  [InboxItemKind.UNMAPPED_EXPENSE]: {
    icon: FINANCE_ICONS.expense,
    tone: IconContainerTone.EXPENSE,
    statusTone: StatusBadgeTone.WARNING,
  },
  [InboxItemKind.INCOME_SUGGEST]: {
    icon: FINANCE_ICONS.income,
    tone: IconContainerTone.INCOME,
    statusTone: StatusBadgeTone.INFO,
  },
  [InboxItemKind.SAVINGS_MATURITY]: {
    icon: FINANCE_ICONS.savings,
    tone: IconContainerTone.SAVINGS,
    statusTone: StatusBadgeTone.WARNING,
  },
  [InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION]: {
    icon: FINANCE_ICONS.savings,
    tone: IconContainerTone.SAVINGS,
    statusTone: StatusBadgeTone.WARNING,
  },
  [InboxItemKind.EMI_COMPLETE]: {
    icon: FINANCE_ICONS.loan,
    tone: IconContainerTone.INFO,
    statusTone: StatusBadgeTone.SUCCESS,
  },
  [InboxItemKind.EMERGENCY_DECLARATION]: {
    icon: FINANCE_ICONS.transfer,
    tone: IconContainerTone.TRANSFER,
    statusTone: StatusBadgeTone.ATTENTION,
  },
  [InboxItemKind.LOAN_PAYMENT_ATTENTION]: {
    icon: FINANCE_ICONS.loan,
    tone: IconContainerTone.INFO,
    statusTone: StatusBadgeTone.WARNING,
  },
  [InboxItemKind.DEBT_PAYMENT_ATTENTION]: {
    icon: FINANCE_ICONS.loan,
    tone: IconContainerTone.EXPENSE,
    statusTone: StatusBadgeTone.WARNING,
  },
};

const LIFECYCLE_LABEL_KEY = {
  [InboxLifecycleContext.DUE]: "lifecycleDue",
  [InboxLifecycleContext.MATURITY]: "lifecycleMaturity",
  [InboxLifecycleContext.EXPIRES]: "lifecycleExpires",
} as const;

export function inboxItemVisual(kind: InboxItemKind): InboxItemVisual {
  return ITEM_VISUALS[kind];
}

export function inboxLifecycleLabelKey(
  context: InboxLifecycleContext | null,
): (typeof LIFECYCLE_LABEL_KEY)[InboxLifecycleContext] | null {
  if (context == null) return null;
  return LIFECYCLE_LABEL_KEY[context];
}

export function inboxDisplayTitle(input: {
  note: string | null | undefined;
  localizedCategory: string | null;
  displayTitle: string;
  kindLabel: string;
}): string {
  const note = input.note?.trim();
  if (note) return note;
  if (input.localizedCategory) return input.localizedCategory;
  const stored = input.displayTitle.trim();
  if (stored) return stored;
  return input.kindLabel;
}
