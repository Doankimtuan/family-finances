import {
  InboxItemKind,
  type InboxItemKind as InboxItemKindType,
} from "./inbox-constants";
import {
  OWNER_STATUS,
  type FinancialCapabilities,
} from "@/modules/shared-kernel/application/financial-ownership";

export const InboxSourceCapability = {
  ACTIONABLE: "actionable",
  READ_ONLY_NON_OWNER: "read_only_non_owner",
  READ_ONLY_FORMER_OWNER: "read_only_former_owner",
  SOURCE_UNAVAILABLE: "source_unavailable",
} as const;

export type InboxSourceCapability =
  (typeof InboxSourceCapability)[keyof typeof InboxSourceCapability];

export type InboxSourceCapabilities = {
  capability: InboxSourceCapability;
};

const SOURCE_BACKED_KINDS = new Set<InboxItemKindType>([
  InboxItemKind.UNMAPPED_EXPENSE,
  InboxItemKind.INCOME_SUGGEST,
  InboxItemKind.SAVINGS_MATURITY,
  InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION,
  InboxItemKind.LOAN_PAYMENT_ATTENTION,
  InboxItemKind.DEBT_PAYMENT_ATTENTION,
]);

export function resolveInboxSourceCapabilities(
  kind: InboxItemKindType,
  ownership: FinancialCapabilities | null,
): InboxSourceCapabilities {
  if (ownership == null) {
    return {
      capability: SOURCE_BACKED_KINDS.has(kind)
        ? InboxSourceCapability.SOURCE_UNAVAILABLE
        : InboxSourceCapability.ACTIONABLE,
    };
  }

  if (!ownership.isPersonal) {
    return { capability: InboxSourceCapability.ACTIONABLE };
  }

  if (ownership.ownerStatus === OWNER_STATUS.FORMER) {
    return { capability: InboxSourceCapability.READ_ONLY_FORMER_OWNER };
  }

  if (!ownership.isOwnedByMe) {
    return { capability: InboxSourceCapability.READ_ONLY_NON_OWNER };
  }

  return {
    capability: InboxSourceCapability.ACTIONABLE,
  };
}
