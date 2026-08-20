import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CorrectTransactionForm } from "@/app/[locale]/(product)/money/transactions/[id]/correct/correct-transaction-form";
import {
  AccountType,
  TransactionDirection,
  TransactionLedgerType,
  TransactionStatus,
  type CaptureJarOption,
  type CategoryTag,
  type LedgerAccount,
  type LedgerTransaction,
} from "@/modules/ledger/application/client";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { OWNER_STATUS } from "@/modules/shared-kernel/application/financial-ownership";

const { correctTransactionMock } = vi.hoisted(() => ({
  correctTransactionMock: vi.fn(),
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
  correctTransactionAction: correctTransactionMock,
}));

const account: LedgerAccount = {
  id: "00000000-0000-4000-8000-000000000101",
  name: "Wallet",
  type: AccountType.CASH,
  balance: 250_000,
  isArchived: false,
  financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
  ownerMembershipId: null,
  isPersonal: false,
  isOwnedByMe: true,
  canMutate: true,
  ownerStatus: OWNER_STATUS.ACTIVE,
};

const tag: CategoryTag = {
  id: "00000000-0000-4000-8000-000000000201",
  kind: TransactionDirection.EXPENSE,
  name: "food",
  jarId: null,
};

const jar: CaptureJarOption = {
  id: "00000000-0000-4000-8000-000000000301",
  name: "Home",
  kind: TransactionDirection.EXPENSE,
};

const transaction: LedgerTransaction = {
  id: "00000000-0000-4000-8000-000000000401",
  accountId: account.id,
  accountName: account.name,
  accountType: account.type,
  type: TransactionLedgerType.EXPENSE,
  amount: 100_000,
  currency: "VND",
  transactionDate: "2026-08-19",
  note: "Lunch",
  categoryId: tag.id,
  categoryName: tag.name,
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

describe("CorrectTransactionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/en/money/transactions/correct");
  });

  it("shows original context and a privacy-safe before/after preview", async () => {
    render(
      <CorrectTransactionForm
        transaction={transaction}
        accounts={[account]}
        expenseTags={[tag]}
        incomeTags={[]}
        jars={[jar]}
        currency="VND"
      />,
    );

    expect(screen.getByText("originalTitle")).toBeInTheDocument();
    expect(screen.getByText("Lunch")).toBeInTheDocument();
    expect(screen.getByText("changeTitle")).toBeInTheDocument();
    expect(screen.getByText("effectiveDateLabel")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("correct-amount"), {
      target: { value: "120000" },
    });
    fireEvent.click(screen.getByTestId("correct-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("correct-before")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("correct-after")).toBeInTheDocument();
    expect(correctTransactionMock).not.toHaveBeenCalled();
  });

  it("records the corrected event and hides implementation ids in the receipt", async () => {
    correctTransactionMock.mockResolvedValue({
      status: "success",
      transactionId: "00000000-0000-4000-8000-000000000402",
      correctionTransactionId: "00000000-0000-4000-8000-000000000402",
      reversalTransactionId: "00000000-0000-4000-8000-000000000403",
    });

    render(
      <CorrectTransactionForm
        transaction={transaction}
        accounts={[account]}
        expenseTags={[tag]}
        incomeTags={[]}
        jars={[jar]}
        currency="VND"
      />,
    );

    fireEvent.click(screen.getByTestId("correct-submit"));
    await waitFor(() =>
      expect(screen.getByTestId("correct-confirm")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId("correct-confirm"));

    await waitFor(() =>
      expect(screen.getByText("receipt.title")).toBeInTheDocument(),
    );
    expect(screen.queryByText("00000000")).not.toBeInTheDocument();
    expect(correctTransactionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        originalTransactionId: transaction.id,
        amount: transaction.amount,
        transactionDate: transaction.transactionDate,
      }),
    );
  });
});
