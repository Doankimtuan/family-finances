import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DebtPaymentHistory } from "@/app/[locale]/(product)/money/debts/[id]/debt-payment-history";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import {
  FINANCIAL_PRIVACY_MASK,
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const baseProps = {
  title: "Payment history",
  countLabel: "1 recorded",
  emptyTitle: "No payments",
  accountFallback: "Unknown account",
  isBorrowed: true,
  formatAmount: () => "₫1,000",
  formatDate: () => "20/08/2026",
  transactionPath: (id: string) => `/en/money/transactions/${id}`,
  retryHref: "/en/money/debts/debt-1",
  readError: false,
  readErrorTitle: "Could not load history",
  readErrorDescription: "Try again.",
  retryLabel: "Retry",
};

describe("Debt detail payment history", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("links each payment row to its related transaction", () => {
    render(
      <DebtPaymentHistory
        {...baseProps}
        payments={[
          {
            id: "payment-1",
            debtId: "debt-1",
            accountId: "account-1",
            accountName: "Cash",
            transactionId: "transaction-1",
            amount: 1_000,
            direction: "repay_borrowed",
            effectiveDate: "2026-08-20",
            note: null,
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("link", { name: /Cash, 20\/08\/2026/ }),
    ).toHaveAttribute("href", "/en/money/transactions/transaction-1");
  });

  it("keeps history error distinct from empty", () => {
    window.localStorage.setItem(
      FINANCIAL_PRIVACY_STORAGE_KEY,
      FINANCIAL_PRIVACY_STORAGE_TRUE,
    );

    render(
      <FinancialPrivacyProvider>
        <DebtPaymentHistory {...baseProps} readError payments={[]} />
      </FinancialPrivacyProvider>,
    );

    expect(screen.getByTestId("debt-history-read-error")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retry" })).toHaveAttribute(
      "href",
      "/en/money/debts/debt-1",
    );
    expect(screen.queryByText("No payments")).not.toBeInTheDocument();
  });

  it("masks payment amounts with global privacy", () => {
    window.localStorage.setItem(
      FINANCIAL_PRIVACY_STORAGE_KEY,
      FINANCIAL_PRIVACY_STORAGE_TRUE,
    );

    render(
      <FinancialPrivacyProvider>
        <DebtPaymentHistory
          {...baseProps}
          payments={[
            {
              id: "payment-1",
              debtId: "debt-1",
              accountId: "account-1",
              accountName: "Cash",
              transactionId: "transaction-1",
              amount: 1_000,
              direction: "repay_borrowed",
              effectiveDate: "2026-08-20",
              note: null,
            },
          ]}
        />
      </FinancialPrivacyProvider>,
    );

    expect(screen.queryByText("₫1,000")).not.toBeInTheDocument();
    expect(screen.getByText(FINANCIAL_PRIVACY_MASK)).toBeInTheDocument();
  });

  it("shows opening paid money as an explicit history entry", () => {
    render(
      <DebtPaymentHistory
        {...baseProps}
        openingPaidAmount={100}
        openingLabel="Paid before tracking"
        totalLabel="Total tracked"
        payments={[
          {
            id: "payment-1",
            debtId: "debt-1",
            accountId: "account-1",
            accountName: "Cash",
            transactionId: "transaction-1",
            amount: 900,
            direction: "repay_borrowed",
            effectiveDate: "2026-08-20",
            note: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("Paid before tracking")).toBeInTheDocument();
    expect(screen.getByText(/Total tracked/)).toHaveTextContent(
      "Total tracked ₫1,000",
    );
  });
});
