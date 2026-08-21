import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvestmentOperationForm } from "@/app/[locale]/(product)/money/investments/investment-operation-form";
import {
  InvestmentAssetClass,
  InvestmentFeeSource,
  InvestmentFormMode,
  InvestmentHistoryStatus,
  INVESTMENT_ERROR_CODE,
  InvestmentLifecycleStatus,
  InvestmentVisibilityContext,
  type InvestmentHolding,
} from "@/modules/investments/application/client";

const { buyMock, replaceMock } = vi.hoisted(() => ({
  buyMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock(
  "@/app/[locale]/(product)/money/investments/investment-actions",
  () => ({
    recordInvestmentBuyAction: buyMock,
    recordInvestmentSellAction: vi.fn(),
    recordAssetConversionAction: vi.fn(),
    recordInvestmentIncomeAction: vi.fn(),
    recordInvestmentValuationAction: vi.fn(),
  }),
);

const HOLDING_ID = "00000000-0000-4000-8000-000000000001";
const OTHER_HOLDING_ID = "00000000-0000-4000-8000-000000000002";
const ACCOUNT_ID = "00000000-0000-4000-8000-000000000003";

const holding: InvestmentHolding = {
  id: HOLDING_ID,
  householdId: "00000000-0000-4000-8000-000000000010",
  name: "Example stock",
  symbol: "EXM",
  assetClass: InvestmentAssetClass.STOCK,
  providerCustodian: "Custodian",
  visibilityContext: InvestmentVisibilityContext.HOUSEHOLD,
  lifecycleStatus: InvestmentLifecycleStatus.ACTIVE,
  historyStatus: InvestmentHistoryStatus.FULL,
  quantity: "10",
  remainingTotalCostBasis: 900_000,
  currentValue: 1_000_000,
  currentValuationDate: "2026-08-17",
  unrealizedResult: 100_000,
  notes: null,
};

const otherHolding = {
  ...holding,
  id: OTHER_HOLDING_ID,
  name: "Other stock",
  symbol: "OTH",
};

function renderBuyForm() {
  return render(
    <InvestmentOperationForm
      mode={InvestmentFormMode.BUY}
      holding={holding}
      holdings={[holding, otherHolding]}
      accounts={[{ id: ACCOUNT_ID, name: "Wallet" }]}
    />,
  );
}

function fillValidBuy() {
  fireEvent.change(screen.getByLabelText("opening.quantityLabel"), {
    target: { value: "2" },
  });
  fireEvent.change(
    screen.getByLabelText("ux.assetClasses.stock.disposalPriceLabel"),
    { target: { value: "100000" } },
  );
}

describe("InvestmentOperationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks an incomplete buy before the action is called", async () => {
    renderBuyForm();

    fireEvent.click(screen.getByTestId("investment-operation-review"));

    expect(
      (await screen.findAllByText("errors.invalid")).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByTestId("investment-operation-preview"),
    ).not.toBeInTheDocument();
    expect(buyMock).not.toHaveBeenCalled();
  });

  it("submits the semantic buy payload and resets the editable fields", async () => {
    buyMock.mockResolvedValue({
      ok: true,
      receipt: { sourceHoldingId: HOLDING_ID, correlationId: "buy-receipt" },
    });
    renderBuyForm();
    fillValidBuy();

    fireEvent.click(screen.getByTestId("investment-operation-review"));
    expect(
      await screen.findByTestId("investment-operation-preview"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("investment-operation-confirm"));

    await waitFor(() => expect(buyMock).toHaveBeenCalledTimes(1));
    expect(buyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        holdingId: HOLDING_ID,
        cashAccountId: ACCOUNT_ID,
        boughtQuantity: "2",
        unitPriceVnd: 100_000,
        totalValueVnd: null,
        fees: [],
      }),
    );
    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining("buy-receipt"),
    );
    fireEvent.click(screen.getByText("edit"));
    expect(screen.getByLabelText("opening.quantityLabel")).toHaveValue("");
    expect(
      screen.getByLabelText("ux.assetClasses.stock.disposalPriceLabel"),
    ).toHaveValue("");
  });

  it("switches fee input by source without submitting stale hidden values", async () => {
    buyMock.mockResolvedValue({
      ok: true,
      receipt: { sourceHoldingId: HOLDING_ID, correlationId: "fee-receipt" },
    });
    renderBuyForm();
    fillValidBuy();
    fireEvent.click(screen.getByText("addFee"));

    fireEvent.change(screen.getByLabelText("feeAmount"), {
      target: { value: "1000" },
    });
    fireEvent.click(screen.getByLabelText("feeSourceLabel"));
    fireEvent.click(
      await screen.findByRole("option", {
        name: "feeSource.destination_asset",
      }),
    );
    expect(screen.queryByLabelText("feeAmount")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("feeQuantity"), {
      target: { value: "0.1" },
    });
    fireEvent.change(screen.getByLabelText("feeValue"), {
      target: { value: "5000" },
    });

    fireEvent.click(screen.getByTestId("investment-operation-review"));
    fireEvent.click(await screen.findByTestId("investment-operation-confirm"));

    await waitFor(() => expect(buyMock).toHaveBeenCalledTimes(1));
    expect(buyMock.mock.calls[0]?.[0].fees).toEqual([
      expect.objectContaining({
        source: InvestmentFeeSource.DESTINATION_ASSET,
        quantity: "0.1",
        feeValueVnd: 5_000,
      }),
    ]);
    expect(buyMock.mock.calls[0]?.[0].fees[0]).not.toHaveProperty("amountVnd");
  });

  it("keeps the form visible and presents a typed server error", async () => {
    buyMock.mockResolvedValue({
      ok: false,
      code: INVESTMENT_ERROR_CODE.INSUFFICIENT_QUANTITY,
    });
    renderBuyForm();
    fillValidBuy();

    fireEvent.click(screen.getByTestId("investment-operation-review"));
    fireEvent.click(await screen.findByTestId("investment-operation-confirm"));

    expect(
      await screen.findByText("errors.insufficient_quantity"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("investment-operation-buy")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
