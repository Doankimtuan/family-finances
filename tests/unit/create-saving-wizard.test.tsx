import type { ReactNode } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateSavingWizard } from "@/app/[locale]/(product)/money/savings/new/create-saving-wizard";
import {
  MaturityTargetMode,
  RenewalPolicy,
  SavingType,
  SettlementRule,
  SAVINGS_PRINCIPAL_QUICK_ADD_VALUES,
} from "@/modules/savings/application/client";
import { formatAmountInput } from "@/shared/i18n/amount-input";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";

const { createSavingMock, replaceMock } = vi.hoisted(() => ({
  createSavingMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
}));

vi.mock("@/shared/hooks/use-online-status", () => ({
  useOnlineStatusClient: () => ({ online: true }),
}));

vi.mock("@/shared/motion", () => ({
  MotionStep: ({ children }: { children: ReactNode }) => <>{children}</>,
  MotionStepDirection: { FORWARD: "forward", BACKWARD: "backward" },
  useMotionPolicy: () => ({ enabled: false }),
}));

vi.mock("@/app/[locale]/(product)/money/savings/savings-actions", () => ({
  createSavingAction: createSavingMock,
}));

const ACCOUNT_ID = "00000000-0000-4000-8000-000000000001";
const OTHER_ACCOUNT_ID = "00000000-0000-4000-8000-000000000002";
const PROVIDER_ID = "00000000-0000-4000-8000-000000000003";
const OTHER_PROVIDER_ID = "00000000-0000-4000-8000-000000000004";
const PACKAGE_ID = "00000000-0000-4000-8000-000000000005";
const OTHER_PACKAGE_ID = "00000000-0000-4000-8000-000000000006";
const REPLACEMENT_ACCOUNT_ID = "00000000-0000-4000-8000-000000000007";
const MANUAL_PROVIDER_ID = "00000000-0000-4000-8000-000000000008";
const MANUAL_PACKAGE_ID = "00000000-0000-4000-8000-000000000009";

const accounts = [
  { id: ACCOUNT_ID, name: "Wallet", type: "cash", balance: 10_000_000 },
  { id: OTHER_ACCOUNT_ID, name: "Bank", type: "checking", balance: 20_000_000 },
];
const providers = [
  {
    id: PROVIDER_ID,
    displayName: "Main Bank",
    savingType: SavingType.BANK_DEPOSIT,
  },
  {
    id: OTHER_PROVIDER_ID,
    displayName: "Digital Bank",
    savingType: SavingType.DIGITAL_SAVING,
  },
  {
    id: MANUAL_PROVIDER_ID,
    displayName: "Manual Saving",
    savingType: SavingType.MANUAL_SAVING,
  },
];
const packagesByProvider = {
  [PROVIDER_ID]: [
    {
      id: PACKAGE_ID,
      packageName: "Main 90",
      durationDays: 90,
      annualInterestRate: 6,
      minAmount: 1_000_000,
      maxAmount: 20_000_000,
    },
  ],
  [OTHER_PROVIDER_ID]: [
    {
      id: OTHER_PACKAGE_ID,
      packageName: "Digital 180",
      durationDays: 180,
      annualInterestRate: 7,
      minAmount: 2_000_000,
      maxAmount: 30_000_000,
    },
  ],
  [MANUAL_PROVIDER_ID]: [
    {
      id: MANUAL_PACKAGE_ID,
      packageName: "Manual 90",
      durationDays: 90,
      annualInterestRate: 6,
      minAmount: 1_000_000,
      maxAmount: 20_000_000,
    },
  ],
};

const unavailable = {
  title: "No accounts",
  actionHref: "/money/accounts",
  actionLabel: "Create account",
};
async function renderWizard() {
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <CreateSavingWizard
        data={Promise.resolve({ accounts, providers, packagesByProvider })}
        unavailable={unavailable}
      />,
    );
  });
  await waitFor(() =>
    expect(screen.getByTestId("savings-create-wizard")).toHaveAttribute(
      "data-ready",
      "true",
    ),
  );
  return result;
}

function reachReview() {
  fireEvent.click(screen.getByTestId("savings-type-platform"));
  fireEvent.click(screen.getByTestId(`savings-package-${PACKAGE_ID}`));
  fireEvent.change(screen.getByTestId("savings-wizard-principal"), {
    target: { value: "3000000" },
  });
  fireEvent.click(screen.getByTestId("savings-wizard-next"));
}

describe("CreateSavingWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with manual savings and updates the package when the provider changes", async () => {
    await renderWizard();

    expect(screen.getByTestId("savings-type-manual")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByTestId("savings-type-platform")).toBeInTheDocument();
    expect(screen.getByTestId("savings-provider")).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue("Manual Saving"), {
      target: { value: "Family nest egg" },
    });

    fireEvent.click(screen.getByTestId("savings-type-platform"));
    expect(
      screen.getByTestId(`savings-package-${PACKAGE_ID}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`savings-provider-${PROVIDER_ID}`),
    ).toHaveAttribute("aria-checked", "true");
    fireEvent.click(
      screen.getByTestId(`savings-provider-${OTHER_PROVIDER_ID}`),
    );
    expect(
      screen.getByTestId(`savings-package-${OTHER_PACKAGE_ID}`),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(`savings-package-${PACKAGE_ID}`),
    ).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Family nest egg")).toBeInTheDocument();
  });

  it("omits the source account for historical savings", async () => {
    await renderWizard();
    expect(screen.getByTestId("savings-create-mode-live")).toBeInTheDocument();
    expect(
      screen.getByTestId("savings-create-mode-historical"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("savings-create-mode-historical"));
    fireEvent.click(screen.getByTestId(`savings-package-${MANUAL_PACKAGE_ID}`));

    expect(screen.queryByTestId("savings-source")).not.toBeInTheDocument();
    expect(screen.getByText("historicalNoSource")).toBeInTheDocument();
  });

  it("retains valid values when moving back from review", async () => {
    await renderWizard();
    reachReview();

    expect(screen.getByTestId("savings-review-summary")).toHaveTextContent(
      "Wallet",
    );
    expect(screen.getAllByText(/3,000,000/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId("savings-wizard-back"));

    expect(screen.getByTestId("savings-wizard-principal")).toHaveValue(
      "3,000,000",
    );
    expect(screen.getByTestId("savings-wizard-start-date")).toBeInTheDocument();
  });

  it("submits the selected maturity strategy and resets the wizard on success", async () => {
    createSavingMock.mockResolvedValue({ status: "success", id: "saving-1" });
    await renderWizard();
    reachReview();
    fireEvent.click(screen.getByTestId("savings-wizard-back"));

    fireEvent.click(
      screen.getByTestId(
        `savings-maturity-strategy-${SettlementRule.ROLL_PRINCIPAL_ONLY}`,
      ),
    );
    fireEvent.click(screen.getByTestId("savings-target-other"));
    fireEvent.click(screen.getByTestId(`savings-target-package-${PACKAGE_ID}`));
    fireEvent.click(
      within(screen.getByTestId("savings-payout-account")).getByRole("button"),
    );
    fireEvent.click(screen.getByRole("option", { name: /Bank/ }));
    fireEvent.click(screen.getByTestId("savings-wizard-next"));
    fireEvent.click(screen.getByTestId("savings-wizard-confirm"));

    await waitFor(() => expect(createSavingMock).toHaveBeenCalledTimes(1));
    expect(createSavingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fundingAccountId: ACCOUNT_ID,
        settlementAccountId: OTHER_ACCOUNT_ID,
        providerId: PROVIDER_ID,
        packageId: PACKAGE_ID,
        principal: 3_000_000,
        settlementRule: SettlementRule.ROLL_PRINCIPAL_ONLY,
        renewalPolicy: RenewalPolicy.ALWAYS_ASK,
        idempotencyKey: expect.any(String),
        renewalConfig: expect.objectContaining({
          targetMode: MaturityTargetMode.SELECT_PACKAGE,
          targetPackageId: PACKAGE_ID,
          preferredSettlementAccountId: OTHER_ACCOUNT_ID,
          payoutAccountId: OTHER_ACCOUNT_ID,
        }),
      }),
    );
    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining("saving-1"),
    );
    await waitFor(() =>
      expect(screen.queryByText(/3,000,000/)).not.toBeInTheDocument(),
    );
  });

  it("shows one typed error and keeps the review state after a failed submission", async () => {
    createSavingMock.mockResolvedValue({
      status: "error",
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
    await renderWizard();
    reachReview();
    fireEvent.click(screen.getByTestId("savings-wizard-confirm"));

    expect(
      await screen.findByText(PRODUCT_ACTION_ERROR_CODE.INVALID),
    ).toBeInTheDocument();
    expect(screen.getByTestId("savings-review-summary")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("reuses one idempotency key across first submit, retry, and double-submit", async () => {
    const firstKey = "11111111-1111-4111-8111-111111111111";
    const secondKey = "22222222-2222-4222-8222-222222222222";
    const randomUuid = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValueOnce(firstKey)
      .mockReturnValueOnce(secondKey);
    createSavingMock.mockResolvedValue({
      status: "error",
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
    await renderWizard();
    reachReview();

    fireEvent.click(screen.getByTestId("savings-wizard-confirm"));
    fireEvent.click(screen.getByTestId("savings-wizard-confirm"));
    await waitFor(() => expect(createSavingMock).toHaveBeenCalled());
    fireEvent.click(screen.getByTestId("savings-wizard-confirm"));

    await waitFor(() =>
      expect(createSavingMock.mock.calls.length).toBeGreaterThanOrEqual(2),
    );
    const keys = createSavingMock.mock.calls.map(
      (call) => call[0].idempotencyKey,
    );
    expect(keys.every((key) => key === firstKey)).toBe(true);
    expect(randomUuid).toHaveBeenCalledTimes(1);
    randomUuid.mockRestore();
  });

  it("mints a new idempotency key for a new create-saving operation", async () => {
    const firstKey = "11111111-1111-4111-8111-111111111111";
    const secondKey = "22222222-2222-4222-8222-222222222222";
    const randomUuid = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValueOnce(firstKey)
      .mockReturnValueOnce(secondKey);
    createSavingMock.mockResolvedValue({
      status: "error",
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });

    const { unmount } = await renderWizard();
    reachReview();
    fireEvent.click(screen.getByTestId("savings-wizard-confirm"));
    await waitFor(() =>
      expect(createSavingMock).toHaveBeenCalledWith(
        expect.objectContaining({ idempotencyKey: firstKey }),
      ),
    );
    unmount();

    await renderWizard();
    reachReview();
    fireEvent.click(screen.getByTestId("savings-wizard-confirm"));
    await waitFor(() =>
      expect(createSavingMock).toHaveBeenCalledWith(
        expect.objectContaining({ idempotencyKey: secondKey }),
      ),
    );
    expect(randomUuid).toHaveBeenCalledTimes(2);
    randomUuid.mockRestore();
  });

  it("disables confirmation when the selected source account is no longer available", async () => {
    const { rerender } = await renderWizard();
    reachReview();

    await act(async () => {
      rerender(
        <CreateSavingWizard
          data={Promise.resolve({
            accounts: [
              accounts[1],
              {
                id: REPLACEMENT_ACCOUNT_ID,
                name: "Savings",
                type: "savings",
                balance: 5_000_000,
              },
            ],
            providers,
            packagesByProvider,
          })}
          unavailable={unavailable}
        />,
      );
    });

    expect(screen.getByTestId("savings-review-summary")).toHaveTextContent(
      "unknown",
    );
    expect(screen.getByTestId("savings-wizard-confirm")).toBeDisabled();
    expect(createSavingMock).not.toHaveBeenCalled();
  });

  it("blocks review when payout and source accounts are the same", async () => {
    await renderWizard();
    reachReview();
    fireEvent.click(screen.getByTestId("savings-wizard-back"));

    fireEvent.click(
      within(screen.getByTestId("savings-payout-account")).getByRole("button"),
    );
    fireEvent.click(screen.getByRole("option", { name: /Wallet/ }));

    expect(screen.getByTestId("savings-wizard-next")).toBeDisabled();
    expect(createSavingMock).not.toHaveBeenCalled();
  });
});

describe("CreateSavingWizard hierarchy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the canonical wizard shell with a combined setup step", async () => {
    await renderWizard();

    expect(screen.getByTestId("savings-create-wizard")).toBeInTheDocument();
    expect(screen.getByTestId("savings-step-indicator")).toBeInTheDocument();
    const stepLabels = within(screen.getByRole("list", { name: "stepOf" }));
    expect(stepLabels.getByText("stepSetup")).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(stepLabels.getByText("stepReview")).toBeInTheDocument();
    expect(stepLabels.queryByText("stepProvider")).not.toBeInTheDocument();
    expect(stepLabels.queryByText("stepFunding")).not.toBeInTheDocument();
    expect(screen.getByTestId("savings-create-mode-live")).toBeInTheDocument();
    expect(screen.getByTestId("savings-type-manual")).toBeInTheDocument();
    expect(screen.getByTestId("savings-type-platform")).toBeInTheDocument();
    expect(screen.getByTestId("savings-provider")).toBeInTheDocument();
    expect(screen.getByTestId("savings-wizard-principal")).toBeInTheDocument();
    expect(screen.getByTestId("savings-wizard-next")).toBeDisabled();
    expect(screen.queryByTestId("savings-wizard-back")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("savings-wizard-confirm"),
    ).not.toBeInTheDocument();
  });

  it("shows setup details together and advances directly to review", async () => {
    await renderWizard();

    fireEvent.click(screen.getByTestId("savings-type-platform"));
    expect(screen.getByTestId(`savings-package-${PACKAGE_ID}`)).toBeVisible();
    expect(screen.getByTestId("savings-wizard-principal")).toBeVisible();
    fireEvent.click(screen.getByTestId(`savings-package-${PACKAGE_ID}`));

    fireEvent.change(screen.getByTestId("savings-wizard-principal"), {
      target: { value: "3000000" },
    });
    fireEvent.click(screen.getByTestId("savings-wizard-next"));

    expect(screen.getByTestId("savings-review-summary")).toBeInTheDocument();
    expect(screen.getByTestId("savings-wizard-confirm")).toBeInTheDocument();
    expect(screen.getByTestId("savings-wizard-back")).toBeInTheDocument();
    expect(screen.queryByTestId("savings-wizard-next")).not.toBeInTheDocument();
  });

  it("keeps shared field composition on the combined setup step", async () => {
    await renderWizard();

    expect(screen.getByTestId("savings-provider")).toBeInTheDocument();
    expect(
      screen.getByTestId(`savings-package-${MANUAL_PACKAGE_ID}`),
    ).toBeInTheDocument();
    expect(screen.getByTestId("savings-wizard-principal")).toBeInTheDocument();
    expect(screen.getByTestId("savings-source")).toBeInTheDocument();
    expect(screen.getByTestId("savings-wizard-start-date")).toBeInTheDocument();
    expect(screen.getByTestId("savings-estimate")).toBeInTheDocument();

    fireEvent.click(
      within(
        screen.getByRole("group", { name: "quickAddAmountLabel" }),
      ).getAllByRole("button")[0],
    );
    expect(screen.getByTestId("savings-wizard-principal")).toHaveValue(
      formatAmountInput(SAVINGS_PRINCIPAL_QUICK_ADD_VALUES[0], "en"),
    );
  });
});
