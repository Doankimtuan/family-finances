import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateSavingWizard } from "@/app/[locale]/(product)/money/savings/new/create-saving-wizard";
import {
  MaturityTargetMode,
  RenewalPolicy,
  SavingType,
  SettlementRule,
} from "@/modules/savings/application/client";
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
};

function renderWizard() {
  return render(
    <CreateSavingWizard
      accounts={accounts}
      providers={providers}
      packagesByProvider={packagesByProvider}
    />,
  );
}

function reachReview() {
  fireEvent.click(screen.getByTestId(`savings-package-${PACKAGE_ID}`));
  fireEvent.click(screen.getByTestId("savings-wizard-next"));
  fireEvent.change(screen.getByTestId("savings-wizard-principal"), {
    target: { value: "3000000" },
  });
  fireEvent.click(screen.getByTestId("savings-wizard-next"));
}

describe("CreateSavingWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes from the first provider and resets the package when the provider changes", () => {
    renderWizard();

    expect(
      screen.getByTestId(`savings-provider-${PROVIDER_ID}`),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByTestId(`savings-package-${PACKAGE_ID}`),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByTestId(`savings-provider-${OTHER_PROVIDER_ID}`),
    );

    expect(
      screen.getByTestId(`savings-package-${OTHER_PACKAGE_ID}`),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(`savings-package-${PACKAGE_ID}`),
    ).not.toBeInTheDocument();
  });

  it("retains valid values when moving back from review", () => {
    renderWizard();
    reachReview();

    expect(screen.getByTestId("savings-review-summary")).toHaveTextContent(
      "Wallet",
    );
    expect(screen.getByText(/3,000,000/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("savings-wizard-back"));

    expect(screen.getByTestId("savings-wizard-principal")).toHaveValue(
      "3,000,000",
    );
    expect(screen.getByTestId("savings-wizard-start-date")).toBeInTheDocument();
  });

  it("submits the selected maturity strategy and resets the wizard on success", async () => {
    createSavingMock.mockResolvedValue({ status: "success", id: "saving-1" });
    renderWizard();
    reachReview();

    fireEvent.click(
      screen.getByTestId(
        `savings-maturity-strategy-${SettlementRule.ROLL_PRINCIPAL_ONLY}`,
      ),
    );
    fireEvent.click(screen.getByTestId("savings-target-other"));
    fireEvent.click(screen.getByTestId(`savings-target-package-${PACKAGE_ID}`));
    fireEvent.click(
      screen.getByTestId("savings-payout-account-" + OTHER_ACCOUNT_ID),
    );
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
    renderWizard();
    reachReview();
    fireEvent.click(screen.getByTestId("savings-wizard-confirm"));

    expect(
      await screen.findByText(PRODUCT_ACTION_ERROR_CODE.INVALID),
    ).toBeInTheDocument();
    expect(screen.getByTestId("savings-review-summary")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
