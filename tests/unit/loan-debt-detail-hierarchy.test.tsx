import type { ComponentProps, ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en/money.json";
import { LoanEditAction } from "@/app/[locale]/(product)/money/loans/[id]/loan-edit-action";
import {
  LoanPaymentHistoryPanel,
  LoanSchedulePanel,
} from "@/app/[locale]/(product)/money/loans/[id]/loan-detail-panels";
import { LoanPayAction } from "@/app/[locale]/(product)/money/loans/[id]/loan-pay-action";
import { DebtDetailHero } from "@/app/[locale]/(product)/money/debts/debt-presentation";
import { DebtPaymentSheet } from "@/app/[locale]/(product)/money/debts/[id]/debt-payment-sheet";
import { LoanDetailHero } from "@/modules/ledger/ui/loan-presentation";
import {
  DebtDirection,
  DebtDueState,
  DebtProgressState,
} from "@/modules/ledger/application";
import {
  LoanDueState,
  LoanScheduleDisplayStatus,
  LoanScheduleEntryStatus,
  LoanStatus,
} from "@/modules/ledger/application/loan-constants";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { moneyTransactionPath } from "@/modules/tenancy/application/app-path";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/shared/hooks/use-online-status", () => ({
  useOnlineStatusClient: () => ({ online: true }),
}));

vi.mock("@/providers/status-alert-provider", () => ({
  useStatusAlert: () => ({
    show: vi.fn(),
    hide: vi.fn(),
  }),
}));

vi.mock("@/app/[locale]/(product)/money/money-products-actions", () => ({
  updateLoanMetadataAction: vi.fn(),
  recordLoanPaymentAction: vi.fn(),
  recordDebtPaymentAction: vi.fn(),
}));

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

const loanDetailMessages = enMessages.loanDetail;

function translateLoanDetail(
  key: string,
  values?: Record<string, string | number>,
) {
  const parts = key.split(".");
  let current: unknown = loanDetailMessages;
  for (const part of parts) {
    if (typeof current !== "object" || current == null || !(part in current)) {
      return key;
    }
    current = (current as Record<string, unknown>)[part];
  }
  if (typeof current !== "string") return key;
  if (!values) return current;
  return current.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(values[name] ?? `{${name}}`),
  );
}

function renderWithProviders(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ money: enMessages }}>
      <FinancialPrivacyProvider>{ui}</FinancialPrivacyProvider>
    </NextIntlClientProvider>,
  );
}

const scheduleEntries = [
  {
    id: "entry-1",
    sequence: 1,
    dueDate: "2026-08-01",
    totalDue: 5_000_000,
    principalDue: 4_200_000,
    interestDue: 800_000,
    remainingBalanceAfter: 75_800_000,
    status: LoanScheduleEntryStatus.PAID,
  },
  {
    id: "entry-2",
    sequence: 2,
    dueDate: "2026-09-01",
    totalDue: 5_000_000,
    principalDue: 4_250_000,
    interestDue: 750_000,
    remainingBalanceAfter: 71_550_000,
    status: LoanScheduleEntryStatus.UPCOMING,
  },
  {
    id: "entry-3",
    sequence: 3,
    dueDate: "2026-09-07",
    totalDue: 5_000_000,
    principalDue: 4_300_000,
    interestDue: 700_000,
    remainingBalanceAfter: 67_250_000,
    status: LoanScheduleEntryStatus.UPCOMING,
  },
];

describe("Loan and debt detail hierarchy", () => {
  it("renders schedule items as compact scan rows without losing facts or order", () => {
    renderWithProviders(
      <LoanSchedulePanel
        title="Repayment timeline"
        emptyLabel="No schedule entries yet."
        entries={scheduleEntries}
        formatMoney={(amount) => `₫${amount.toLocaleString("en-US")}`}
        t={translateLoanDetail}
        today="2026-09-07"
      />,
    );

    const rows = screen.getAllByTestId(/loan-schedule-/);
    expect(rows.map((row) => row.getAttribute("data-testid"))).toEqual([
      "loan-schedule-1",
      "loan-schedule-2",
      "loan-schedule-3",
    ]);
    expect(rows[0]).toHaveAttribute(
      "data-schedule-status",
      LoanScheduleEntryStatus.PAID,
    );
    expect(rows[0]).toHaveAttribute(
      "data-schedule-display-status",
      LoanScheduleDisplayStatus.PAID,
    );
    expect(rows[2]).toHaveAttribute(
      "data-schedule-display-status",
      LoanScheduleDisplayStatus.DUE_TODAY,
    );
    expect(screen.getByText("Month 1 · 2026-08-01")).toBeInTheDocument();
    expect(screen.getAllByText("₫5,000,000")).toHaveLength(3);
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("Due today")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Principal ₫4,200,000 · Interest ₫800,000 · Remaining ₫75,800,000",
      ),
    ).toBeInTheDocument();
    expect(rows[0].querySelector("div.flex.w-full")).toBeNull();
  });

  it("keeps payment history amounts, splits, accounts, and transaction links", () => {
    renderWithProviders(
      <LoanPaymentHistoryPanel
        title="Payment history"
        formatMoney={(amount) => `₫${amount.toLocaleString("en-US")}`}
        accountNames={new Map([["account-1", "Cash"]])}
        t={translateLoanDetail}
        payments={[
          {
            id: "payment-1",
            accountId: "account-1",
            paidAt: "2026-08-01",
            amount: 5_000_000,
            principalPaid: 4_200_000,
            interestPaid: 800_000,
            transactionId: "transaction-1",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("loan-payment-payment-1")).toBeInTheDocument();
    expect(screen.getByText("₫5,000,000")).toBeInTheDocument();
    expect(
      screen.getByText(/Principal ₫4,200,000 · Interest ₫800,000/),
    ).toBeInTheDocument();
    expect(screen.getByText(/From Cash/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /2026-08-01, View transaction/ }),
    ).toHaveAttribute("href", moneyTransactionPath("transaction-1"));
  });

  it("exposes loan edit as a secondary compact control with an accessible name", () => {
    renderWithProviders(
      <LoanEditAction
        loanId="loan-1"
        initialName="Home loan"
        initialLender="VCB"
        initialNote=""
        compactTrigger
      />,
    );

    const edit = screen.getByTestId("loan-edit-open");
    expect(edit).toHaveAttribute("aria-label", "Edit loan");
    fireEvent.click(edit);
    expect(screen.getByTestId("loan-edit-form")).toBeInTheDocument();
  });

  it("keeps remaining principal and next-payment facts on the loan hero", () => {
    renderWithProviders(
      <LoanDetailHero
        remainingPrincipal={80_000_000}
        currency={DEFAULT_CURRENCY}
        locale="en"
        dueState={LoanDueState.UPCOMING}
        dueLabel="Due 2026-10-01"
        status={LoanStatus.ACTIVE}
        statusLabel="Active"
        nextPaymentAmount={5_000_000}
        nextPaymentDate="01/10/2026"
        progress={0.2}
        context={<span>Household</span>}
        labels={{
          remaining: "Remaining principal",
          nextPayment: "Next payment amount",
          nextPaymentDate: "Next payment date",
          progress: "20% paid",
          none: "None",
        }}
      />,
    );

    expect(screen.getByText("Remaining principal")).toBeInTheDocument();
    expect(screen.getByText("Household")).toBeInTheDocument();
    expect(screen.getByText("Next payment amount")).toBeInTheDocument();
    expect(screen.getByText("20% paid")).toBeInTheDocument();
  });

  it("opens the existing loan payment confirmation instead of mutating immediately", () => {
    renderWithProviders(
      <LoanPayAction
        loanId="loan-1"
        loanName="Home loan"
        currency={DEFAULT_CURRENCY}
        principalDue={4_250_000}
        interestDue={750_000}
        totalDue={5_000_000}
        remainingPrincipal={71_550_000}
        accounts={[{ id: "account-1", name: "Cash" }]}
        paidAtDefault="2026-09-07"
      />,
    );

    fireEvent.click(screen.getByTestId("loan-pay-open"));
    expect(screen.getByTestId("loan-pay")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("loan-pay-preview"));
    expect(screen.getByTestId("loan-pay-confirm")).toBeInTheDocument();
    expect(screen.getByTestId("loan-pay-cta")).toBeInTheDocument();
  });

  it("keeps add-payment as the debt primary action and opens confirmation after review", async () => {
    renderWithProviders(
      <DebtPaymentSheet
        debtId="debt-1"
        direction={DebtDirection.BORROWED}
        remainingAmount={600_000}
        currency={DEFAULT_CURRENCY}
        locale="en"
        accounts={[{ id: "account-1", name: "Cash", balance: 2_000_000 }]}
        accountsLoadFailed={false}
        today="2026-09-07"
      />,
    );

    const primary = screen.getByTestId("debt-payment-open");
    expect(primary).toHaveTextContent("Repay debt");
    fireEvent.click(primary);
    expect(screen.getByText("Amount to repay")).toBeInTheDocument();
  });

  it("keeps debt identity and remaining amount in the hero", () => {
    renderWithProviders(
      <DebtDetailHero
        direction={DebtDirection.BORROWED}
        remainingAmount={600_000}
        due={{ state: DebtDueState.DUE_SOON, daysUntilDue: 3 }}
        dueDate="2026-09-10"
        progress={{
          paidAmount: 400_000,
          remainingAmount: 600_000,
          percent: 40,
          state: DebtProgressState.IN_PROGRESS,
        }}
        currency={DEFAULT_CURRENCY}
        locale="en"
        context={<span>Household</span>}
        labels={{
          dueDate: (date) => `Due ${date}`,
          today: "Due today",
          daysLeft: (days) => `${days} days left`,
          daysOverdue: (days) => `${days} days overdue`,
          completed: "Completed",
          paid: "Paid",
          received: "Received",
          remainingToPay: "Still to repay",
          remainingToReceive: "Still to receive",
        }}
      />,
    );

    expect(screen.getByTestId("debt-detail-hero")).toHaveTextContent(
      "Still to repay",
    );
    expect(screen.getByText("Household")).toBeInTheDocument();
    expect(screen.getByText("3 days left")).toBeInTheDocument();
  });
});
