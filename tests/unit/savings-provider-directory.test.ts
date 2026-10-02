import { describe, expect, it } from "vitest";
import { buildSavingsProviderDirectory } from "@/modules/savings/application/savings-provider-directory";
import {
  mapSavingRow,
  mapSavingCycleRow,
} from "@/modules/savings/application/savings-types";
import type { SavingCatalogProvider } from "@/modules/savings/application/savings-provider-registry";
import {
  SavingsFamily,
  SavingStatus,
  SavingType,
  CycleStatus,
  RenewalPolicy,
} from "@/modules/savings/application/savings-constants";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";

const catalog: SavingCatalogProvider[] = [
  {
    id: "bank",
    displayName: "Bank",
    family: SavingsFamily.BANK,
    isSystem: true,
    packages: [],
  },
  {
    id: "platform",
    displayName: "Platform",
    family: SavingsFamily.PLATFORM,
    isSystem: true,
    packages: [],
  },
  {
    id: "custom",
    displayName: "Custom bank",
    family: SavingsFamily.BANK,
    isSystem: false,
    packages: [],
  },
];

function saving(
  principal: number,
  status: SavingStatus = SavingStatus.ACTIVE,
  currency = DEFAULT_CURRENCY,
) {
  const result = mapSavingRow({
    id: `saving-${principal}`,
    household_id: "household",
    status,
    funding_account_id: null,
    settlement_account_id: "account",
    provider_id: "bank",
    product_name: "Deposit",
    product_snapshot: { currency },
    renewal_policy: RenewalPolicy.ALWAYS_ASK,
    renewal_config: null,
    maturity_instruction: null,
    created_at: "2026-01-01T00:00:00Z",
    saving_providers: {
      display_name: "Bank",
      provider_key: "bank",
      saving_type: SavingType.BANK_DEPOSIT,
    },
  });
  result.latestCycle = mapSavingCycleRow({
    id: "cycle",
    saving_id: result.id,
    cycle_number: 1,
    start_date: "2026-01-01",
    end_date: "2099-01-01",
    principal,
    locked_rate: 0,
    package_snapshot: {},
    accrued_interest: 0,
    settlement_result: null,
    renewal_decision: null,
    previous_cycle_id: null,
    next_cycle_id: null,
    status: CycleStatus.ACTIVE,
    funding_transaction_id: null,
    settlement_transaction_id: null,
    created_at: "2026-01-01T00:00:00Z",
  });
  return result;
}

describe("savings provider directory", () => {
  it("groups by system ownership before provider family", () => {
    const model = buildSavingsProviderDirectory(catalog, []);
    expect(model.banks.map(({ provider }) => provider.id)).toEqual(["bank"]);
    expect(model.platforms.map(({ provider }) => provider.id)).toEqual([
      "platform",
    ]);
    expect(model.custom.map(({ provider }) => provider.id)).toEqual(["custom"]);
    expect(model.providerCount).toBe(3);
  });

  it("totals open principal and excludes settled savings without mixing currencies", () => {
    const model = buildSavingsProviderDirectory(catalog, [
      saving(100),
      saving(200),
      saving(400, SavingStatus.CLOSED),
      saving(5, SavingStatus.ACTIVE, "test-currency"),
    ]);
    expect(model.banks[0].savingCount).toBe(3);
    expect(model.banks[0].balances).toEqual([
      { currency: DEFAULT_CURRENCY, amount: 300 },
      { currency: "test-currency", amount: 5 },
    ]);
    expect(model.custom[0].balances).toEqual([]);
  });

  it("distinguishes failed balance loading from an empty household", () => {
    expect(buildSavingsProviderDirectory(catalog, null).balancesAvailable).toBe(
      false,
    );
    expect(buildSavingsProviderDirectory([], []).balancesAvailable).toBe(true);
  });
});
