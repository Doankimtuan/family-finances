import type { IconSvgElement } from "@hugeicons/react";
import {
  InboxItemKind,
  InboxKindFilter,
  InboxLifecycleContext,
} from "@/modules/inbox/application/inbox-constants";
import { InboxSourceCapability } from "@/modules/inbox/application/inbox-source-capabilities";
import { formatCurrency } from "@/shared/i18n/formatters";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
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

const OWNERSHIP_HINT_KEY = {
  [InboxSourceCapability.READ_ONLY_FORMER_OWNER]: "ownerUnavailableHint",
  [InboxSourceCapability.READ_ONLY_NON_OWNER]: "ownerRequiredHint",
  [InboxSourceCapability.SOURCE_UNAVAILABLE]: "sourceUnavailableHint",
} as const;

export type InboxOwnershipHintKey =
  (typeof OWNERSHIP_HINT_KEY)[keyof typeof OWNERSHIP_HINT_KEY];

export function inboxOwnershipHintKey(
  capability: InboxSourceCapability,
): InboxOwnershipHintKey | null {
  if (capability === InboxSourceCapability.ACTIONABLE) return null;
  return OWNERSHIP_HINT_KEY[capability];
}

export function inboxRowSupportingText(
  parts: readonly (string | null | undefined)[],
): string | null {
  const compact = parts.filter((part): part is string => Boolean(part?.trim()));
  if (compact.length === 0) return null;
  return compact.join(" · ");
}

export function inboxQueueRowSubtitle(input: {
  lifecycleLabel: string | null;
  ownershipHint: string | null;
  detailParts: readonly string[];
}): string | null {
  if (input.lifecycleLabel) {
    return inboxRowSupportingText([input.lifecycleLabel, ...input.detailParts]);
  }
  return inboxRowSupportingText([...input.detailParts, input.ownershipHint]);
}

/**
 * Queue rows already lead with the maturity countdown/state in the title.
 * Keep the absolute maturity date on detail; omit it from the compact scan line.
 */
export function inboxQueueLifecycleLabel(input: {
  context: InboxLifecycleContext | null;
  label: string | null;
}): string | null {
  if (input.context === InboxLifecycleContext.MATURITY) return null;
  return input.label;
}

const INBOX_QUEUE_TITLE_CONTEXT_SEPARATOR = " — ";

/**
 * Savings-maturity stored titles are `{product} — {countdown/state}`.
 * Keep the countdown as the dominant queue title and move the product into
 * compact secondary context so the scan row stays one title line.
 */
export function inboxQueueDominantTitle(input: {
  kind: InboxItemKind | null;
  displayTitle: string;
}): { title: string; context: string | null } {
  if (input.kind !== InboxItemKind.SAVINGS_MATURITY) {
    return { title: input.displayTitle, context: null };
  }
  const separatorIndex = input.displayTitle.lastIndexOf(
    INBOX_QUEUE_TITLE_CONTEXT_SEPARATOR,
  );
  if (separatorIndex <= 0) {
    return { title: input.displayTitle, context: null };
  }
  const context = input.displayTitle.slice(0, separatorIndex).trim();
  const title = input.displayTitle
    .slice(separatorIndex + INBOX_QUEUE_TITLE_CONTEXT_SEPARATOR.length)
    .trim();
  if (!context || !title) {
    return { title: input.displayTitle, context: null };
  }
  return { title, context };
}

const INBOX_AMOUNT_KIND: Record<InboxItemKind, FinancialNumberKind> = {
  [InboxItemKind.UNMAPPED_EXPENSE]: FinancialNumberKind.MOVEMENT,
  [InboxItemKind.INCOME_SUGGEST]: FinancialNumberKind.MOVEMENT,
  [InboxItemKind.SAVINGS_MATURITY]: FinancialNumberKind.CURRENT_STATE,
  [InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION]:
    FinancialNumberKind.CURRENT_STATE,
  [InboxItemKind.EMI_COMPLETE]: FinancialNumberKind.CURRENT_STATE,
  [InboxItemKind.EMERGENCY_DECLARATION]: FinancialNumberKind.INTENTION,
  [InboxItemKind.LOAN_PAYMENT_ATTENTION]: FinancialNumberKind.CURRENT_STATE,
  [InboxItemKind.DEBT_PAYMENT_ATTENTION]: FinancialNumberKind.CURRENT_STATE,
};

export function inboxAmountKind(
  kind: InboxItemKind | null,
): FinancialNumberKind {
  if (kind == null) return FinancialNumberKind.CURRENT_STATE;
  return INBOX_AMOUNT_KIND[kind];
}

export function inboxAmountLabel(
  amount: number | null | undefined,
  currency: string | null | undefined,
  locale: string,
): string | null {
  if (amount == null || !Number.isFinite(amount) || !currency) {
    return null;
  }
  return formatCurrency(amount, currency, locale, {
    maximumFractionDigits: 0,
  });
}

export type InboxKindGroup<T extends { kind: InboxItemKind | null }> = {
  kind: InboxItemKind;
  items: T[];
};

/**
 * Presentation grouping by existing kind. Groups appear in first-seen order
 * from the current list; items inside a group keep that list's order.
 */
export function groupInboxItemsByKind<T extends { kind: InboxItemKind | null }>(
  items: readonly T[],
): InboxKindGroup<T>[] {
  const groups = new Map<InboxItemKind, T[]>();
  const order: InboxItemKind[] = [];

  for (const item of items) {
    if (item.kind == null) continue;
    const existing = groups.get(item.kind);
    if (existing) {
      existing.push(item);
      continue;
    }
    groups.set(item.kind, [item]);
    order.push(item.kind);
  }

  return order.map((kind) => ({
    kind,
    items: groups.get(kind) ?? [],
  }));
}

export function isInboxFilterActive(
  kind: InboxKindFilterId,
  query: string,
): boolean {
  return kind !== InboxKindFilter.ALL || query.trim().length > 0;
}
