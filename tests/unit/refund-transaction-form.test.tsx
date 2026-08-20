import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RefundTransactionForm } from "@/app/[locale]/(product)/money/transactions/[id]/refund/refund-transaction-form";
import {
  AccountType,
  TransactionLedgerType,
  TransactionStatus,
  type LedgerAccount,
  type LedgerTransaction,
} from "@/modules/ledger/application/client";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { OWNER_STATUS } from "@/modules/shared-kernel/application/financial-ownership";

const { refundTransactionMock } = vi.hoisted(() => ({
  refundTransactionMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children?: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/app/[locale]/(product)/money/transactions/mutate-actions", () => ({
  refundTransactionAction: refundTransactionMock,
}));

const account: LedgerAccount = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Wallet",
  type: AccountType.CASH,
  balance: 100_000,
  isArchived: false,
  financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
  ownerMembershipId: null,
  isPersonal: false,
  isOwnedByMe: true,
  canMutate: true,
  ownerStatus: OWNER_STATUS.ACTIVE,
};

const transaction: LedgerTransaction = {
  id: "00000000-0000-4000-8000-000000000010",
  accountId: account.id,
  accountName: account.name,
  accountType: account.type,
  type: TransactionLedgerType.EXPENSE,
  amount: 100_000,
  currency: "VND",
  transactionDate: "2026-08-19",
  note: "Lunch",
  categoryId: null,
  categoryName: "food",
  jarId: null,
  jarName: null,
  tags: [],
  status: TransactionStatus.POSTED,
  transferGroupId: null,
  savingsEventKind: null,
  reversesTransactionId: null,
  correctsTransactionId: null,
  isReversal: false,
  createdAt: "2026-08-19T10:00:00.000Z",
};

describe("RefundTransactionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/en/money/transactions/refund");
  });

  it("shows the original event, destination, effective date, and capped amount", async () => {
    render(
      <RefundTransactionForm
        transaction={transaction}
        currency="VND"
        maxRefundable={50_000}
        destinationAccounts={[account]}
        defaultTransactionDate="2026-08-20"
      />,
    );

    expect(screen.getByText("originalTitle")).toBeInTheDocument();
    expect(screen.getByText("Lunch")).toBeInTheDocument();
    expect(screen.getByText("destinationLabel")).toBeInTheDocument();
    expect(screen.getByText("effectiveDateLabel")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("refund-amount"), {
      target: { value: "60000" },
    });
    fireEvent.click(screen.getByTestId("refund-submit"));

    await waitFor(() =>
      expect(screen.getAllByText("errors.invalid")).not.toHaveLength(0),
    );
    expect(refundTransactionMock).not.toHaveBeenCalled();
  });
});
