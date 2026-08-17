import type { ComponentProps, ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { recordTransactionMock, setTransactionTagsMock } = vi.hoisted(() => ({
  recordTransactionMock: vi.fn(),
  setTransactionTagsMock: vi.fn(),
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
  recordTransactionAction: recordTransactionMock,
}));

vi.mock("@/app/[locale]/(product)/money/transactions/tag-actions", () => ({
  createTransactionTagAction: vi.fn(),
  setTransactionTagsAction: setTransactionTagsMock,
}));

import { CaptureTransactionForm } from "@/app/[locale]/(product)/money/transactions/capture-transaction-form";
import {
  StatusAlertHost,
  StatusAlertProvider,
} from "@/providers/status-alert-provider";
import {
  AccountType,
  TransactionTagColorKey,
  TransactionTagIconKey,
  type LedgerAccount,
  type TransactionTag,
} from "@/modules/ledger/application/client";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";

const account: LedgerAccount = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Wallet",
  type: AccountType.CASH,
  balance: 0,
  isArchived: false,
};

const transactionTag: TransactionTag = {
  id: "00000000-0000-4000-8000-000000000003",
  name: "Work",
  iconKey: TransactionTagIconKey.WORK,
  colorKey: TransactionTagColorKey.BLUE,
  archivedAt: null,
};

function renderCaptureForm(
  props: Partial<ComponentProps<typeof CaptureTransactionForm>> = {},
) {
  return render(
    <StatusAlertProvider>
      <CaptureTransactionForm
        accounts={[account]}
        expenseTags={[]}
        incomeTags={[]}
        jars={[]}
        transactionTags={[]}
        currency="VND"
        {...props}
      />
      <StatusAlertHost />
    </StatusAlertProvider>,
  );
}

describe("CaptureTransactionForm save-failure presentation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
    recordTransactionMock.mockResolvedValue({
      status: "error",
      code: PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED,
    });
  });

  it("renders one danger alert with the typed code, not a second generic alert", async () => {
    renderCaptureForm();

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/^amountLabel/), {
        target: { value: "50000" },
      });
      fireEvent.submit(screen.getByTestId("money-capture-form"));
    });

    expect(recordTransactionMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("errors.month_locked")).toBeInTheDocument();
    expect(screen.getAllByText("errorTitle")).toHaveLength(1);
    expect(screen.queryByText("saveFailedBody")).not.toBeInTheDocument();
    expect(screen.getByTestId("money-capture-form")).toBeInTheDocument();
  });

  it("keeps validation in the form and does not call the server for invalid input", async () => {
    renderCaptureForm();

    await act(async () => {
      fireEvent.submit(screen.getByTestId("money-capture-form"));
    });

    expect(recordTransactionMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("money-capture-form")).toBeInTheDocument();
  });

  it("shows an immutable success receipt and resets for another transaction", async () => {
    recordTransactionMock.mockResolvedValue({
      status: "success",
      transactionId: "00000000-0000-0000-0000-000000000002",
      inboxItemId: null,
    });

    renderCaptureForm();

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/^amountLabel/), {
        target: { value: "50000" },
      });
      fireEvent.submit(screen.getByTestId("money-capture-form"));
    });

    expect(await screen.findByText("receipt.title")).toBeInTheDocument();
    expect(screen.getByText(/50,000/)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText("receipt.recordAnother"));
    });

    expect(screen.getByTestId("money-capture-form")).toBeInTheDocument();
    expect(screen.getByLabelText(/^amountLabel/)).toHaveValue("");
  });

  it("shows the receipt with a warning when the required tag follow-up fails", async () => {
    recordTransactionMock.mockResolvedValue({
      status: "success",
      transactionId: "00000000-0000-4000-8000-000000000002",
      inboxItemId: null,
    });
    setTransactionTagsMock.mockResolvedValue({
      status: "error",
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    });

    renderCaptureForm({ transactionTags: [transactionTag] });

    fireEvent.click(screen.getByText("choose"));
    fireEvent.click(screen.getByRole("button", { name: "Work" }));
    fireEvent.click(screen.getByText("done"));
    fireEvent.change(screen.getByLabelText(/^amountLabel/), {
      target: { value: "50000" },
    });
    fireEvent.submit(screen.getByTestId("money-capture-form"));

    expect(await screen.findByText("tagAssignmentFailed")).toBeInTheDocument();
  });
});
