import {
  InboxItemKind,
  type InboxItemKind as InboxItemKindType,
} from "./inbox-constants";
import {
  OWNER_STATUS,
  type OwnerStatus,
} from "@/modules/shared-kernel/application/financial-ownership";

export type InboxSourceCapabilities = {
  sourceOwnerActive: boolean;
  ownerUnavailable: boolean;
  canExecuteOutcome: boolean;
};

export function resolveInboxSourceCapabilities(
  kind: InboxItemKindType,
  ownerStatus: OwnerStatus | null,
): InboxSourceCapabilities {
  if (kind === InboxItemKind.EMI_COMPLETE || ownerStatus == null) {
    return {
      sourceOwnerActive: true,
      ownerUnavailable: false,
      canExecuteOutcome: true,
    };
  }

  const ownerUnavailable = ownerStatus === OWNER_STATUS.FORMER;
  return {
    sourceOwnerActive: !ownerUnavailable,
    ownerUnavailable,
    canExecuteOutcome: !ownerUnavailable,
  };
}
