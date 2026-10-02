import type { IconSvgElement } from "@hugeicons/react";
import {
  InboxItemKind,
  InboxKindFilter,
  InboxLifecycleContext,
} from "@/modules/inbox/application/inbox-constants";
import { InboxSourceCapability } from "@/modules/inbox/application/inbox-source-capabilities";
import { formatCurrency } from "@/shared/i18n/formatters";
import type { InboxAccent } from "@/shared/patterns/inbox-row";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FinancialAmountTone } from "@/shared/ui/financial-amount";
import { IconContainerTone } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadgeTone } from "@/shared/ui/status-badge";

export type InboxItemVisual = {
  icon: IconSvgElement;
  tone: IconContainerTone;
  statusTone: StatusBadgeTone;
  accent: InboxAccent;
};

export type InboxKindFilterId = typeof InboxKindFilter.ALL | InboxItemKind;

const ITEM_VISUALS: Record<InboxItemKind, InboxItemVisual> = {
  [InboxItemKind.UNMAPPED_EXPENSE]: {
    icon: FINANCE_ICONS.expense,
    tone: IconContainerTone.EXPENSE,
    statusTone: StatusBadgeTone.WARNING,
    accent: "rose",
  },
  [InboxItemKind.INCOME_SUGGEST]: {
    icon: FINANCE_ICONS.income,
    tone: IconContainerTone.INCOME,
    statusTone: StatusBadgeTone.INFO,
    accent: "teal",
  },
  [InboxItemKind.SAVINGS_MATURITY]: {
    icon: FINANCE_ICONS.savings,
    tone: IconContainerTone.SAVINGS,
    statusTone: StatusBadgeTone.WARNING,
    accent: "amber",
  },
  [InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION]: {
    icon: FINANCE_ICONS.savings,
    tone: IconContainerTone.SAVINGS,
    statusTone: StatusBadgeTone.WARNING,
    accent: "amber",
  },
  [InboxItemKind.EMI_COMPLETE]: {
    icon: FINANCE_ICONS.loan,
    tone: IconContainerTone.INFO,
    statusTone: StatusBadgeTone.SUCCESS,
    accent: "teal",
  },
  [InboxItemKind.EMERGENCY_DECLARATION]: {
    icon: FINANCE_ICONS.transfer,
    tone: IconContainerTone.TRANSFER,
    statusTone: StatusBadgeTone.ATTENTION,
    accent: "rose",
  },
  [InboxItemKind.LOAN_PAYMENT_ATTENTION]: {
    icon: FINANCE_ICONS.loan,
    tone: IconContainerTone.INFO,
    statusTone: StatusBadgeTone.WARNING,
    accent: "amber",
  },
  [InboxItemKind.DEBT_PAYMENT_ATTENTION]: {
    icon: FINANCE_ICONS.loan,
    tone: IconContainerTone.EXPENSE,
    statusTone: StatusBadgeTone.WARNING,
    accent: "rose",
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
  return inboxRowSupportingText([
    input.lifecycleLabel,
    ...input.detailParts,
    input.ownershipHint,
  ]);
}

const INBOX_QUEUE_TITLE_CONTEXT_SEPARATOR = " — ";

/**
 * Keep the savings product and its maturity state together in the scan title.
 * Stitch places the product first; accountName fills it when stored titles are
 * only a generic state such as “Matured”.
 */
export function inboxQueueDominantTitle(input: {
  kind: InboxItemKind | null;
  displayTitle: string;
  accountName: string | null;
}): { title: string } {
  if (input.kind !== InboxItemKind.SAVINGS_MATURITY) {
    return { title: input.displayTitle };
  }

  const accountName = input.accountName?.trim();
  if (!accountName || input.displayTitle.startsWith(accountName)) {
    return { title: input.displayTitle };
  }

  return {
    title: `${accountName}${INBOX_QUEUE_TITLE_CONTEXT_SEPARATOR}${input.displayTitle}`,
  };
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

const INBOX_AMOUNT_TONE: Record<InboxItemKind, FinancialAmountTone> = {
  [InboxItemKind.UNMAPPED_EXPENSE]: FinancialAmountTone.EXPENSE,
  [InboxItemKind.INCOME_SUGGEST]: FinancialAmountTone.INCOME,
  [InboxItemKind.SAVINGS_MATURITY]: FinancialAmountTone.NEUTRAL,
  [InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION]: FinancialAmountTone.NEUTRAL,
  [InboxItemKind.EMI_COMPLETE]: FinancialAmountTone.NEUTRAL,
  [InboxItemKind.EMERGENCY_DECLARATION]: FinancialAmountTone.NEUTRAL,
  [InboxItemKind.LOAN_PAYMENT_ATTENTION]: FinancialAmountTone.DEBT,
  [InboxItemKind.DEBT_PAYMENT_ATTENTION]: FinancialAmountTone.DEBT,
};

export function inboxAmountKind(
  kind: InboxItemKind | null,
): FinancialNumberKind {
  if (kind == null) return FinancialNumberKind.CURRENT_STATE;
  return INBOX_AMOUNT_KIND[kind];
}

export function inboxAmountTone(
  kind: InboxItemKind | null,
): FinancialAmountTone {
  if (kind == null) return FinancialAmountTone.NEUTRAL;
  return INBOX_AMOUNT_TONE[kind];
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

export function isInboxFilterActive(
  kind: InboxKindFilterId,
  query: string,
): boolean {
  return kind !== InboxKindFilter.ALL || query.trim().length > 0;
}
