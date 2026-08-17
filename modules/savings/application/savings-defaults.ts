import {
  MaturityFallbackPolicy,
  MaturityTargetMode,
  SettlementRule,
} from "./savings-constants";
import type { RenewalConfig } from "./types/savings.types";

export function emptyRenewalConfig(): RenewalConfig {
  return {
    preferredPackageId: null,
    preferredSettlementRule: SettlementRule.ROLL_PRINCIPAL_INTEREST,
    preferredSettlementAccountId: null,
    targetMode: MaturityTargetMode.KEEP_CURRENT_PACKAGE,
    targetPackageId: null,
    payoutAccountId: null,
    fallbackPolicy: MaturityFallbackPolicy.ASK_USER,
  };
}
