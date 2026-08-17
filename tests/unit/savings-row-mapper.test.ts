import { describe, expect, it } from "vitest";
import {
  CycleStatus,
  InterestCalcMethod,
  MaturityTargetMode,
  PenaltyStrategy,
  RenewalPolicy,
  SavingStatus,
  SavingType,
  SavingsFamily,
  SettlementRule,
} from "@/modules/savings/application/savings-constants";
import {
  EarlySettlementRule,
  SavingsTaxRule,
  SavingsTermUnit,
} from "@/modules/savings/application/savings-domain-rules";
import {
  mapEarlyWithdrawalRow,
  mapPackageRow,
  mapProviderRow,
  mapSavingCycleRow,
  mapSavingRow,
} from "@/modules/savings/application/infrastructure/savings-row.mapper";

describe("Savings row mappers", () => {
  it("maps provider metadata and early-withdrawal numeric values", () => {
    const provider = mapProviderRow({
      id: "provider-id",
      provider_key: "bank",
      display_name: "Bank",
      saving_type: SavingType.BANK_DEPOSIT,
      is_active: true,
      metadata: null,
      family: SavingsFamily.BANK,
      household_id: null,
    });
    const withdrawal = mapEarlyWithdrawalRow({
      id: "withdrawal-id",
      cycle_id: "cycle-id",
      saving_id: "saving-id",
      requested_at: "2026-01-02T00:00:00.000Z",
      principal: "10000000",
      accrued_interest: "100000",
      eligible_interest: "50000",
      penalty_amount: "50000",
      net_returned: "10050000",
      penalty_strategy: PenaltyStrategy.NO_INTEREST,
      settlement_transaction_id: null,
    });

    expect(provider).toMatchObject({
      savingType: SavingType.BANK_DEPOSIT,
      family: SavingsFamily.BANK,
      metadata: {},
      householdId: null,
      isSystem: true,
    });
    expect(withdrawal).toMatchObject({
      principal: 10_000_000,
      accruedInterest: 100_000,
      eligibleInterest: 50_000,
      penaltyAmount: 50_000,
      netReturned: 10_050_000,
    });
  });

  it("normalizes package numeric values and supported configuration enums", () => {
    const result = mapPackageRow({
      id: "package-id",
      provider_id: "provider-id",
      package_name: "90 Days",
      duration_days: 90,
      annual_interest_rate: "4.5",
      min_amount: null,
      max_amount: "500000000",
      settlement_rules: [SettlementRule.ROLL_PRINCIPAL_INTEREST, "invalid"],
      penalty_rules: [{ strategy: PenaltyStrategy.NO_INTEREST }],
      renewable_available: true,
      is_active: true,
      term_amount: 3,
      term_unit: SavingsTermUnit.MONTH,
      interest_calculation_method: InterestCalcMethod.SIMPLE,
      currency: "VND",
      tax_rule: SavingsTaxRule.PROFIT_PERCENTAGE,
      tax_rate_percent: "5",
      early_settlement_rule: EarlySettlementRule.CUSTOM_RATE,
      early_settlement_rate_percent: "0.5",
      supports_partial_settlement: null,
    });

    expect(result).toMatchObject({
      annualInterestRate: 4.5,
      minAmount: null,
      maxAmount: 500_000_000,
      settlementRules: [SettlementRule.ROLL_PRINCIPAL_INTEREST],
      termUnit: SavingsTermUnit.MONTH,
      taxRatePercent: 5,
      earlySettlementRatePercent: 0.5,
      supportsPartialSettlement: undefined,
    });
  });

  it("maps joined saving rows and derives legacy-safe renewal values", () => {
    const result = mapSavingRow({
      id: "saving-id",
      household_id: "household-id",
      status: SavingStatus.MATURED,
      funding_account_id: "funding-id",
      settlement_account_id: "settlement-id",
      provider_id: "provider-id",
      product_name: "Term deposit",
      product_snapshot: JSON.stringify({
        providerId: "provider-id",
        productName: "Term deposit",
        packageName: "90 Days",
        depositTermDays: 90,
        annualInterestRate: 4.5,
        interestCalculationMethod: InterestCalcMethod.SIMPLE,
        settlementRule: SettlementRule.ROLL_PRINCIPAL_INTEREST,
        penaltyStrategy: PenaltyStrategy.NO_INTEREST,
        providerRules: {},
      }),
      renewal_policy: RenewalPolicy.ALWAYS_ASK,
      renewal_config: null,
      maturity_instruction: null,
      created_at: "2026-01-01T00:00:00.000Z",
      funding_accounts: [{ name: "Cash" }],
      settlement_accounts: { name: "Savings" },
      saving_providers: {
        display_name: "Bank",
        provider_key: "bank",
        saving_type: SavingType.BANK_DEPOSIT,
      },
    });

    expect(result).toMatchObject({
      status: SavingStatus.MATURED,
      fundingAccountName: "Cash",
      settlementAccountName: "Savings",
      providerName: "Bank",
      providerSavingType: SavingType.BANK_DEPOSIT,
      savingsFamily: SavingsFamily.BANK,
      renewalPolicy: RenewalPolicy.ALWAYS_ASK,
      renewalPreference: RenewalPolicy.ALWAYS_ASK,
      latestCycle: null,
    });
    expect(result.renewalConfig.preferredPackageId).toBeNull();
    expect(result.maturityInstruction.targetMode).toBe(
      MaturityTargetMode.KEEP_CURRENT_PACKAGE,
    );
  });

  it("keeps nullable cycle payloads safe when JSON columns are invalid", () => {
    const result = mapSavingCycleRow({
      id: "cycle-id",
      saving_id: "saving-id",
      cycle_number: 2,
      start_date: "2026-01-01",
      end_date: "2026-04-01",
      principal: "10000000",
      locked_rate: "4.5",
      package_snapshot: "not-json",
      accrued_interest: "not-a-number",
      settlement_result: "not-json",
      renewal_decision: null,
      previous_cycle_id: null,
      next_cycle_id: null,
      status: CycleStatus.ACTIVE,
      funding_transaction_id: null,
      settlement_transaction_id: null,
      created_at: "2026-01-01T00:00:00.000Z",
    });

    expect(result).toMatchObject({
      cycleNumber: 2,
      principal: 10_000_000,
      lockedRate: 4.5,
      accruedInterest: 0,
      settlementResult: null,
      renewalDecision: null,
      previousCycleId: null,
      nextCycleId: null,
    });
    expect(result.packageSnapshot).toEqual({
      packageName: "",
      durationDays: 0,
      annualInterestRate: 0,
      settlementRules: [],
      penaltyRules: [],
      renewableAvailable: true,
      minAmount: null,
      maxAmount: null,
    });
  });
});
