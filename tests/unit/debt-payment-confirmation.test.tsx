import type { ComponentProps, ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en/money.json";
import { DebtPaymentSheet } from "@/app/[locale]/(product)/money/debts/[id]/debt-payment-sheet";
import { DebtDirection } from "@/modules/ledger/application/ledger-constants";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { ProductActionStatus } from "@/modules/tenancy/application/product-action-error";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";

const { recordDebtPaymentMock, refreshMock } = vi.hoisted(() => ({
  recordDebtPaymentMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

vi.mock("@/shared/hooks/use-online-status", () => ({
  useOnlineStatusClient: () => ({ online: true }),
}));

vi.mock("@/shared/motion", () => ({
  MotionStep: ({ children }: { children: ReactNode }) => <>{children}</>,
  useMotionPolicy: () => ({ enabled: false }),
}));

vi.mock("@/app/[locale]/(product)/money/money-products-actions", () => ({
  recordDebtPaymentAction: recordDebtPaymentMock,
}));

const ACCOUNT_ID = "00000000-0000-4000-8000-000000000001";
const accounts = [{ id: ACCOUNT_ID, name: "Cash", balance: 2_000_000 }];

function renderPaymentSheet() {
  return render(
    <NextIntlClientProvider locale="en" messages={{ money: enMessages }}>
      <FinancialPrivacyProvider>
        <DebtPaymentSheet
          debtId="debt-1"
          direction={DebtDirection.BORROWED}
          remainingAmount={600_000}
          currency={DEFAULT_CURRENCY}
          locale="en"
          accounts={accounts}
          accountsLoadFailed={false}
          today="2026-09-07"
        />
      </FinancialPrivacyProvider>
    </NextIntlClientProvider>,
  );
}

function openPaymentForm() {
  fireEvent.click(screen.getByTestId("debt-payment-open"));
}

async function selectCashAccount() {
  fireEvent.click(screen.getByLabelText("Pay from account"));
  fireEvent.click(await screen.findByRole("option", { name: /Cash/ }));
}

async function reachConfirmation() {
  openPaymentForm();
  await selectCashAccount();
  fireEvent.click(screen.getByTestId("debt-payment-submit"));
  await waitFor(() => {
    expect(screen.getByText("Confirm this repayment")).toBeInTheDocument();
  });
}

describe("DebtPaymentSheet confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recordDebtPaymentMock.mockResolvedValue({
      status: ProductActionStatus.SUCCESS,
      transactionId: "tx-1",
      amount: 600_000,
      remainingPrincipal: 0,
      completed: true,
    });
  });

  it("shows payment context on the confirmation step", async () => {
    renderPaymentSheet();
    await reachConfirmation();

    expect(screen.getByText("Confirm this repayment")).toBeInTheDocument();
    expect(
      screen.getByText("Check the details before recording."),
    ).toBeInTheDocument();
    expect(screen.getByText("Amount to repay")).toBeInTheDocument();
    expect(screen.getAllByText("₫600,000").length).toBeGreaterThan(0);
    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("Payment date")).toBeInTheDocument();
    expect(screen.getByText(/09\/07\/2026/)).toBeInTheDocument();
    expect(screen.getByText("After this payment")).toBeInTheDocument();
    expect(screen.getByText("Still to repay")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm repayment" }),
    ).toBeInTheDocument();
  });

  it("does not mutate before confirmation", async () => {
    renderPaymentSheet();
    openPaymentForm();
    await selectCashAccount();

    expect(recordDebtPaymentMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("debt-payment-submit"));
    expect(recordDebtPaymentMock).not.toHaveBeenCalled();
  });

  it("records exactly one payment after confirmation", async () => {
    renderPaymentSheet();
    await reachConfirmation();

    fireEvent.click(screen.getByRole("button", { name: "Confirm repayment" }));

    await waitFor(() => expect(recordDebtPaymentMock).toHaveBeenCalledTimes(1));
    expect(recordDebtPaymentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        debtId: "debt-1",
        accountId: ACCOUNT_ID,
        amount: 600_000,
        effectiveDate: "2026-09-07",
      }),
    );
  });

  it("does not mutate when the user cancels from the form", async () => {
    renderPaymentSheet();
    openPaymentForm();
    await selectCashAccount();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(recordDebtPaymentMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("debt-payment-open")).toBeInTheDocument();
  });

  it("returns to the form without mutating when confirmation is dismissed", async () => {
    renderPaymentSheet();
    await reachConfirmation();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(recordDebtPaymentMock).not.toHaveBeenCalled();
    expect(document.getElementById("debt-payment-amount")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review" })).toBeInTheDocument();
  });
});
