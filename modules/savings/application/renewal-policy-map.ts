import {
  RenewalPolicy,
  RenewalPreference,
  SettlementRule,
  RenewalSuggestedAction,
  type RenewalPolicy as RenewalPolicyType,
  type SettlementRule as SettlementRuleType,
} from "./savings-constants";

/**
 * Map legacy RenewalPreference storage values → RenewalPolicy.
 */
export function mapLegacyRenewalPreference(
  value: string | null | undefined,
): RenewalPolicyType {
  switch (value) {
    case RenewalPreference.AUTO_RENEW_SAME_PACKAGE:
    case RenewalPreference.AUTO_RENEW_SELECTED_PACKAGE:
      return RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED;
    case RenewalPreference.WITHDRAW_EVERYTHING:
      return RenewalPolicy.USE_SAVED_PREFERENCE;
    case RenewalPolicy.ALWAYS_ASK:
    case RenewalPolicy.USE_SAVED_PREFERENCE:
    case RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED:
    case RenewalPolicy.ONE_TIME_RENEWAL:
      return value;
    case RenewalPreference.MANUAL_REVIEW:
    default:
      return RenewalPolicy.ALWAYS_ASK;
  }
}

export function defaultRenewalConfigForLegacyPreference(
  value: string | null | undefined,
): {
  preferredPackageId: string | null;
  preferredSettlementRule: SettlementRuleType;
  preferredSettlementAccountId: string | null;
} {
  if (value === RenewalPreference.WITHDRAW_EVERYTHING) {
    return {
      preferredPackageId: null,
      preferredSettlementRule: SettlementRule.WITHDRAW_EVERYTHING,
      preferredSettlementAccountId: null,
    };
  }
  return {
    preferredPackageId: null,
    preferredSettlementRule: SettlementRule.ROLL_PRINCIPAL_INTEREST,
    preferredSettlementAccountId: null,
  };
}

export function suggestedActionForPolicy(
  policy: RenewalPolicyType,
  configSettlementRule: SettlementRuleType | null | undefined,
): (typeof RenewalSuggestedAction)[keyof typeof RenewalSuggestedAction] {
  switch (policy) {
    case RenewalPolicy.ALWAYS_ASK:
      return RenewalSuggestedAction.NONE;
    case RenewalPolicy.USE_SAVED_PREFERENCE:
      if (configSettlementRule === SettlementRule.WITHDRAW_EVERYTHING) {
        return RenewalSuggestedAction.WITHDRAW;
      }
      return RenewalSuggestedAction.CONFIRM_CONFIGURED;
    case RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED:
    case RenewalPolicy.ONE_TIME_RENEWAL:
      return RenewalSuggestedAction.CONFIRM_CONFIGURED;
    default:
      return RenewalSuggestedAction.NONE;
  }
}

export function renewalConfidenceForPolicy(
  policy: RenewalPolicyType,
): number {
  switch (policy) {
    case RenewalPolicy.ALWAYS_ASK:
      return 0;
    case RenewalPolicy.USE_SAVED_PREFERENCE:
      return 0.7;
    case RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED:
      return 0.9;
    case RenewalPolicy.ONE_TIME_RENEWAL:
      return 0.85;
    default:
      return 0;
  }
}

/** After a successful renew, One-time Renewal reverts to Always Ask. */
export function nextRenewalPolicyAfterRenew(
  policy: RenewalPolicyType,
): RenewalPolicyType {
  if (policy === RenewalPolicy.ONE_TIME_RENEWAL) {
    return RenewalPolicy.ALWAYS_ASK;
  }
  return policy;
}
