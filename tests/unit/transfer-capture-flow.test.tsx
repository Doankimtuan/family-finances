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
    expect(
      screen.queryByTestId(`transfer-destination-${accounts[0].id}`),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId(`transfer-destination-${accounts[1].id}`),
    ).toBeInTheDocument();
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
