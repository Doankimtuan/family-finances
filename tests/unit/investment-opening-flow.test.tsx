import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OpeningPositionForm } from "@/app/[locale]/(product)/money/investments/opening-position-form";
import { InvestmentAssetClass } from "@/modules/investments/application/investment-constants";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";

const { importMock, purchaseMock, replaceMock } = vi.hoisted(() => ({
  importMock: vi.fn(),
  purchaseMock: vi.fn(),
  replaceMock: vi.fn(),
}));
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));
vi.mock("@/shared/hooks/use-online-status", () => ({
  useOnlineStatus: () => true,
}));
vi.mock("@/shared/motion", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/shared/motion")>();
  return {
    ...original,
    MotionStep: ({ children }: { children: React.ReactNode }) => children,
  };
});
vi.mock("@/app/[locale]/(product)/money/money-offline-banner", () => ({
  MoneyOfflineBanner: () => null,
}));
vi.mock(
  "@/app/[locale]/(product)/money/investments/instrument-picker-sheet",
  () => ({ InstrumentPickerSheet: () => null }),
);
vi.mock(
  "@/app/[locale]/(product)/money/investments/investment-creation-actions",
  () => ({
    createOpeningPositionAction: importMock,
    createInitialPurchaseAction: purchaseMock,
  }),
);
vi.mock(
  "@/app/[locale]/(product)/money/investments/investment-input-currency-actions",
  () => ({ getInvestmentInputCurrencyRateAction: vi.fn() }),
);

const ACCOUNT_ID = "00000000-0000-4000-8000-000000000003";
const HOLDING_ID = "00000000-0000-4000-8000-000000000001";
async function selectFund() {
  fireEvent.click(
    screen.getByTestId(`investment-type-${InvestmentAssetClass.FUND}`),
  );
  fireEvent.change(screen.getByLabelText("holdingName"), {
    target: { value: "Family fund" },
  });
  fireEvent.click(screen.getByTestId("investment-opening-next"));
  await screen.findByTestId("investment-entry-mode");
}
function fillQuantity(value = "4000") {
  fireEvent.change(
    screen.getByLabelText("ux.assetClasses.fund.quantityLabel"),
    { target: { value } },
  );
}

describe("Stitch three-step investment creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    importMock.mockResolvedValue({
      ok: true,
      receipt: { holdingId: HOLDING_ID },
    });
    purchaseMock.mockResolvedValue({
      ok: true,
      receipt: { holdingId: HOLDING_ID },
    });
  });
  it("validates identity, preserves decimal quantity, and previews before importing numeric values", async () => {
    render(<OpeningPositionForm />);
    fireEvent.click(screen.getByTestId("investment-opening-next"));
    await screen.findAllByText("errors.invalid");
    expect(
      screen.queryByTestId("investment-entry-mode"),
    ).not.toBeInTheDocument();
    await selectFund();
    fillQuantity("0.12345678");
    fireEvent.click(
      screen.getByRole("button", { name: "design.increaseQuantity" }),
    );
    expect(
      screen.getByLabelText("ux.assetClasses.fund.quantityLabel"),
    ).toHaveValue("1.12345678");
    fireEvent.click(
      screen.getByRole("button", { name: "design.decreaseQuantity" }),
    );
    expect(
      screen.getByLabelText("ux.assetClasses.fund.quantityLabel"),
    ).toHaveValue("0.12345678");
    fillQuantity("1");
    fireEvent.click(
      screen.getByRole("button", { name: "design.decreaseQuantity" }),
    );
    expect(
      screen.getByLabelText("ux.assetClasses.fund.quantityLabel"),
    ).toHaveValue("0");
    fireEvent.click(
      screen.getByRole("button", { name: "design.increaseQuantity" }),
    );
    expect(
      screen.getByLabelText("ux.assetClasses.fund.quantityLabel"),
    ).toHaveValue("1");
    fillQuantity();
    fireEvent.change(screen.getByLabelText("design.unitCost"), {
      target: { value: "25000" },
    });
    fireEvent.change(screen.getByLabelText("design.marketUnitPrice"), {
      target: { value: "30000" },
    });
    expect(
      screen.getByTestId("investment-opening-calculations"),
    ).toHaveTextContent("120,000,000");
    expect(
      screen.getByTestId("investment-opening-calculations"),
    ).toHaveTextContent("20%");
    fireEvent.click(screen.getByRole("radio", { name: "personal" }));
    fireEvent.click(screen.getByTestId("investment-opening-review"));
    await screen.findByTestId("investment-opening-preview");
    expect(importMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("investment-opening-confirm"));
    await waitFor(() =>
      expect(importMock).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: "4000",
          remainingTotalCostBasis: 100_000_000,
          currentValuation: 120_000_000,
          financialScope: FINANCIAL_SCOPE.PERSONAL,
        }),
      ),
    );
    expect(purchaseMock).not.toHaveBeenCalled();
  });
  it("keeps unknown historical basis and valuation unknown", async () => {
    render(<OpeningPositionForm />);
    await selectFund();
    fillQuantity("2");
    fireEvent.click(screen.getByTestId("investment-opening-review"));
    await screen.findByTestId("investment-opening-preview");
    fireEvent.click(screen.getByTestId("investment-opening-confirm"));
    await waitFor(() =>
      expect(importMock).toHaveBeenCalledWith(
        expect.objectContaining({
          remainingTotalCostBasis: null,
          currentValuation: null,
        }),
      ),
    );
  });
  it("keeps the cash purchase separate and requires review before posting", async () => {
    render(
      <OpeningPositionForm accounts={[{ id: ACCOUNT_ID, name: "Wallet" }]} />,
    );
    await selectFund();
    fireEvent.click(screen.getByRole("tab", { name: "design.purchase" }));
    fillQuantity();
    fireEvent.change(screen.getByLabelText("ux.assetClasses.fund.priceLabel"), {
      target: { value: "25000" },
    });
    fireEvent.click(screen.getByTestId("investment-opening-review"));
    await screen.findByTestId("investment-opening-preview");
    expect(purchaseMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("investment-opening-confirm"));
    await waitFor(() =>
      expect(purchaseMock).toHaveBeenCalledWith(
        expect.objectContaining({
          unitPriceVnd: 25_000,
          cashAccountId: ACCOUNT_ID,
          quantity: "4000",
        }),
      ),
    );
    expect(importMock).not.toHaveBeenCalled();
  });
});
