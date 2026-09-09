import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en/money.json";
import { SavingsProductRow } from "@/app/[locale]/(product)/money/savings/savings-product-row";
import { LoanProductRow } from "@/app/[locale]/(product)/money/loans/loan-product-row";
import { DebtProductRow } from "@/app/[locale]/(product)/money/debts/debt-product-row";
import { DebtDirection, DebtDueState } from "@/modules/ledger/application";
import {
  LoanDueState,
  LoanStatus,
  LoanType,
} from "@/modules/ledger/application/loan-constants";
import {
  SavingsFamily,
  SavingsMaturityState,
} from "@/modules/savings/application";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { moneyLoanPath } from "@/modules/tenancy/application/app-path";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import {
  FINANCIAL_PRIVACY_MASK,
  FINANCIAL_PRIVACY_STORAGE_KEY,
} from "@/shared/constants/financial-privacy";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

const dueLabels = {
  dueDate: (date: string) => `Due ${date}`,
  today: "Due today",
  daysLeft: (days: number) => `${days} days left`,
  daysOverdue: (days: number) => `${days} days overdue`,
  completed: "Completed",
};

function renderWithPrivacy(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ money: enMessages }}>
      <FinancialPrivacyProvider>{ui}</FinancialPrivacyProvider>
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  window.localStorage.clear();
});

describe("phase 7 savings / loans / debts presentation", () => {
  it("makes savings principal primary and puts maturity in a labeled footer", () => {
    renderWithPrivacy(
      <SavingsProductRow
        href="/money/savings/1"
        testId="savings-row-1"
        family={SavingsFamily.BANK}
        familyLabel="Bank"
        title="Vietcombank"
        subtitle="12-month term · 6.2% / year"
        principalLabel="₫50,000,000"
        principalCaption="Principal"
        maturityState={SavingsMaturityState.ACTIVE}
        maturityLabel="Active"
        maturityMeta="Matures 12 Oct 2026"
      />,
    );

    const row = screen.getByTestId("savings-row-1");
    expect(row).toHaveAttribute("href", "/money/savings/1");
    expect(row.closest("[data-financial-object='savings']")).not.toBeNull();
    expect(screen.getByText("Vietcombank")).toBeInTheDocument();
    expect(screen.getByText("₫50,000,000")).toBeInTheDocument();
    expect(screen.getByText("Principal")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Matures 12 Oct 2026")).toBeInTheDocument();
    expect(screen.queryByText(/hũ/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/goal/i)).not.toBeInTheDocument();
  });

  it("masks savings principal without leaking the amount into the row label", () => {
    window.localStorage.setItem(FINANCIAL_PRIVACY_STORAGE_KEY, "true");

    renderWithPrivacy(
      <SavingsProductRow
        href="/money/savings/1"
        testId="savings-row-masked"
        family={SavingsFamily.BANK}
        familyLabel="Bank"
        title="Vietcombank"
        subtitle="12-month term"
        principalLabel="₫50,000,000"
        principalCaption="Principal"
        maturityState={SavingsMaturityState.MATURED}
        maturityLabel="Matured"
        maturityMeta="Matures 12 Oct 2026"
      />,
    );

    const row = screen.getByTestId("savings-row-masked");
    expect(screen.getByText(FINANCIAL_PRIVACY_MASK)).toBeInTheDocument();
    expect(screen.queryByText("₫50,000,000")).not.toBeInTheDocument();
    expect(row.getAttribute("aria-label") ?? "").not.toContain("50,000,000");
    expect(screen.getByText("Matured")).toBeInTheDocument();
  });

  it("keeps loan remaining principal primary and next payment secondary", () => {
    renderWithPrivacy(
      <LoanProductRow
        href={moneyLoanPath("loan-1")}
        testId="loan-row-phase-7"
        loanType={LoanType.HOME}
        typeLabel="Home loan"
        title="Home loan"
        subtitle="Vietcombank · Home loan"
        remainingAmount="₫820,000,000"
        remainingCaption="Remaining principal"
        nextPaymentCaption="Next payment"
        nextPaymentAmount="₫18,500,000"
        dueState={LoanDueState.DUE_SOON}
        dueLabel="Due 12 Oct 2026"
        status={LoanStatus.ACTIVE}
        statusLabel="Active"
        ownership={{
          financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
          isOwnedByMe: false,
        }}
      />,
    );

    const row = screen.getByTestId("loan-row-phase-7");
    expect(row).toHaveAttribute("data-financial-object", "loan");
    expect(screen.getByText("Remaining principal")).toBeInTheDocument();
    expect(screen.getByText("Next payment")).toBeInTheDocument();
    expect(screen.getByText("₫820,000,000")).toBeInTheDocument();
    expect(screen.getByText("₫18,500,000")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("makes debt counterpart and owed direction readable without color", () => {
    renderWithPrivacy(
      <DebtProductRow
        href="/money/debts/1"
        testId="debt-row-phase-7"
        direction={DebtDirection.LENT}
        directionLabel="Owes you"
        title="An"
        amountLabel="₫2,500,000"
        amountCaption="Still to receive"
        due={{ state: DebtDueState.UPCOMING, daysUntilDue: 12 }}
        dueDate="2026-10-12"
        dueLabels={dueLabels}
        locale="en"
      />,
    );

    const row = screen.getByTestId("debt-row-phase-7");
    expect(row).toHaveAttribute("data-financial-object", "debt");
    expect(row).toHaveAttribute("data-debt-direction", DebtDirection.LENT);
    expect(screen.getByText("An")).toBeInTheDocument();
    expect(screen.getByText("Owes you")).toBeInTheDocument();
    expect(screen.getByText("Still to receive")).toBeInTheDocument();
    expect(screen.getByText("₫2,500,000")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("masks debt outstanding without putting the amount in an accessible name", () => {
    window.localStorage.setItem(FINANCIAL_PRIVACY_STORAGE_KEY, "true");

    renderWithPrivacy(
      <DebtProductRow
        href="/money/debts/2"
        testId="debt-row-masked"
        direction={DebtDirection.BORROWED}
        directionLabel="You owe"
        title="Binh"
        amountLabel="₫2,500,000"
        amountCaption="Still to repay"
        due={{ state: DebtDueState.NONE, daysUntilDue: null }}
        dueDate={null}
        dueLabels={dueLabels}
        locale="en"
      />,
    );

    const row = screen.getByTestId("debt-row-masked");
    expect(screen.getByText(FINANCIAL_PRIVACY_MASK)).toBeInTheDocument();
    expect(screen.queryByText("₫2,500,000")).not.toBeInTheDocument();
    expect(row.getAttribute("aria-label") ?? "").not.toContain("2,500,000");
    expect(screen.getByText("You owe")).toBeInTheDocument();
  });
});
