/**
 * Compatibility exports for existing Savings deep imports.
 * New code should import from the responsibility-specific modules.
 */
export type * from "./types/savings.types";

export { emptyRenewalConfig } from "./savings-defaults";
export {
  mapProviderRow,
  mapPackageRow,
  mapSavingRow,
  mapSavingCycleRow,
  mapEarlyWithdrawalRow,
} from "./infrastructure/savings-row.mapper";
export { selectCurrentSavingCycle } from "./selectors/savings.selectors";
