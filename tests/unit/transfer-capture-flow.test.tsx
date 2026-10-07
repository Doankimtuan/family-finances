import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TransferCaptureFlow } from "@/app/[locale]/(product)/money/transactions/transfer-capture-flow";
import {
  AccountType,
  type LedgerAccount,
} from "@/modules/ledger/application/client";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";

const { recordTransferMock } = vi.hoisted(() => ({
  recordTransferMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children?: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/app/[locale]/(product)/money/transactions/actions", () => ({
  recordTransferAction: recordTransferMock,
}));

const accounts: LedgerAccount[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Wallet",
    type: AccountType.CASH,
    balance: 100_000,
    isArchived: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Bank",
    type: AccountType.CHECKING,
    balance: 100_000,
    isArchived: false,
  },
];

function renderFlow() {
  return render(<TransferCaptureFlow accounts={accounts} currency="VND" />);
}

function fillTransfer() {
  fireEvent.change(screen.getByTestId("transfer-amount"), {
    target: { value: "50000" },
  });
  fireEvent.click(screen.getByTestId("transfer-preview-continue"));
}

describe("TransferCaptureFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recordTransferMock.mockResolvedValue({
      status: "error",
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    });
  });

  it("submits a valid transfer and keeps the receipt stable after reset", async () => {
    recordTransferMock.mockResolvedValue({
      status: "success",
      transferGroupId: "group-1",
      sourceTransactionId: "source-1",
      destinationTransactionId: "destination-1",
      sourceDelta: -50_000,
      destinationDelta: 50_000,
    });
    renderFlow();

    fillTransfer();
    await waitFor(() =>
      expect(screen.getByTestId("transfer-confirm")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId("transfer-confirm"));

    expect(
      await screen.findByTestId("transfer-receipt-neutrality"),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/50,000/).length).toBeGreaterThan(0);
    expect(recordTransferMock).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 50_000 }),
    );
  });

  it("excludes the selected source from transfer destinations", () => {
    renderFlow();
    fireEvent.click(screen.getByLabelText(/^toLabel/));
    expect(
      screen.queryByRole("option", { name: /Wallet/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Bank/ })).toBeInTheDocument();
  });

  it("keeps independent transfer fields while account references resolve", async () => {
    const view = render(
      <TransferCaptureFlow
        accounts={[]}
        accountsReady={false}
        currency="VND"
      />,
    );
    fireEvent.change(screen.getByTestId("transfer-amount"), {
      target: { value: "50000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "yesterday" }));
    fireEvent.change(screen.getByLabelText("noteLabel"), {
      target: { value: "typed before accounts" },
    });
    const form = screen.getByTestId("money-transfer-form");
    expect(screen.getByTestId("transfer-preview-continue")).toBeDisabled();

    view.rerender(
      <TransferCaptureFlow accounts={accounts} accountsReady currency="VND" />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("transfer-preview-continue")).toBeEnabled(),
    );
    expect(screen.getByTestId("money-transfer-form")).toBe(form);
    expect(screen.getByTestId("transfer-amount")).not.toHaveValue("");
    expect(screen.getByLabelText("noteLabel")).toHaveValue(
      "typed before accounts",
    );
    expect(screen.getByRole("button", { name: "yesterday" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("returns to the form with one typed error after server failure", async () => {
    renderFlow();
    fillTransfer();
    await waitFor(() =>
      expect(screen.getByTestId("transfer-confirm")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId("transfer-confirm"));

    expect(await screen.findByText("errors.invalid")).toBeInTheDocument();
    expect(screen.getByTestId("money-transfer-form")).toBeInTheDocument();
  });
});
