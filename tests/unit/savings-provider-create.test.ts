import { beforeEach, expect, it, vi } from "vitest";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import { SavingType } from "@/modules/savings/application/savings-constants";
import {
  SavingsFamily,
  SavingsTaxRule,
} from "@/modules/savings/application/savings-domain-rules";
import {
  savingsProviderCreateDefaults,
  savingsProviderCreateSchema,
  initialSavingsProduct,
} from "@/modules/savings/application/savings-provider-create";
import { saveSavingsProviderWithPackage } from "@/app/[locale]/(product)/money/savings/providers/new/actions";
import {
  createSavingsProvider,
  updateSavingsProvider,
  createSavingsProduct,
} from "@/modules/savings/application/commands/manage-savings-catalog";

vi.mock(
  "@/modules/savings/application/commands/manage-savings-catalog",
  () => ({
    createSavingsProvider: vi.fn(),
    updateSavingsProvider: vi.fn(),
    createSavingsProduct: vi.fn(),
  }),
);
vi.mock("@/app/mutation-revalidation", () => ({
  revalidateSavingsCatalogViews: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());

it("starts fresh and applies canonical family policies to the optional package", () => {
  const input = { ...savingsProviderCreateDefaults(), name: "Household bank" };
  expect(savingsProviderCreateSchema.safeParse(input).success).toBe(true);
  expect(initialSavingsProduct(input, "provider-id")).toBeNull();
  const packageInput = initialSavingsProduct(
    { ...input, packageName: "Annual", family: SavingsFamily.PLATFORM },
    "provider-id",
  );
  expect(packageInput?.taxRule).toBe(SavingsTaxRule.PROFIT_PERCENTAGE);
  expect(savingsProviderCreateDefaults().name).toBe("");
  expect(
    savingsProviderCreateSchema.safeParse({
      ...input,
      annualInterestRatePercent: 101,
    }).success,
  ).toBe(false);
});

it("validates before writing and retries a failed package on the saved provider", async () => {
  const invalid = await saveSavingsProviderWithPackage(
    savingsProviderCreateDefaults(),
    null,
  );
  expect(invalid.ok).toBe(false);
  expect(createSavingsProvider).not.toHaveBeenCalled();
  const providerId = "b94aab89-dc6f-468f-bc45-0ab1640fb527";
  const provider = {
    ok: true as const,
    value: {
      id: providerId,
      providerKey: "household-bank",
      displayName: "Household bank",
      savingType: SavingType.BANK_DEPOSIT,
      isActive: true,
      metadata: {},
    },
  };
  vi.mocked(createSavingsProvider).mockResolvedValue(provider);
  vi.mocked(updateSavingsProvider).mockResolvedValue(provider);
  vi.mocked(createSavingsProduct).mockResolvedValueOnce({
    ok: false,
    code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
  });
  const input = {
    ...savingsProviderCreateDefaults(),
    name: "Household bank",
    packageName: "Annual",
  };
  expect(await saveSavingsProviderWithPackage(input, null)).toEqual({
    ok: false,
    code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    providerId,
  });
  vi.mocked(createSavingsProduct).mockResolvedValueOnce({
    ok: true,
    value: {
      id: "package-id",
      providerId,
      packageName: input.packageName,
      durationDays: 360,
      annualInterestRate: input.annualInterestRatePercent,
      minAmount: null,
      maxAmount: null,
      settlementRules: [],
      penaltyRules: [],
      renewableAvailable: true,
      isActive: true,
    },
  });
  expect(await saveSavingsProviderWithPackage(input, providerId)).toEqual({
    ok: true,
  });
  expect(createSavingsProvider).toHaveBeenCalledTimes(1);
  expect(updateSavingsProvider).toHaveBeenCalledWith(
    providerId,
    expect.objectContaining({ name: input.name }),
  );
});
