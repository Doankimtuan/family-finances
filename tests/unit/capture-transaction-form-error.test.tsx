import type { ReactNode } from "react";
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
  AccountType,
  type LedgerAccount,
} from "@/modules/ledger/application/client";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";

const account: LedgerAccount = {
  id: "a1",
  name: "Wallet",
  type: AccountType.CASH,
  balance: 0,
  isArchived: false,
};

describe("CaptureTransactionForm save-failure presentation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recordTransactionMock.mockResolvedValue({
      status: "error",
      code: PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED,
    });
  });

  it("renders one danger alert with the typed code, not a second generic alert", async () => {
    render(
      <CaptureTransactionForm
        accounts={[account]}
        expenseTags={[]}
        incomeTags={[]}
        jars={[]}
        transactionTags={[]}
        currency="VND"
      />,
    );

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/^amountLabel/), {
        target: { value: "50000" },
      });
      fireEvent.click(screen.getByTestId("capture-save"));
    });

    expect(recordTransactionMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("errors.month_locked")).toBeInTheDocument();
    expect(screen.getAllByText("errorTitle")).toHaveLength(1);
    expect(screen.queryByText("saveFailedBody")).not.toBeInTheDocument();
    expect(screen.getByTestId("money-capture-form")).toBeInTheDocument();
  });
});
