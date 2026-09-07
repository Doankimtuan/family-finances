import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en/money.json";
import { loanTypeIcon } from "@/app/[locale]/(product)/money/loans/loan-type-icon";
import {
  LoanFactNote,
  LoanFactRow,
  LoanFactsCard,
} from "@/app/[locale]/(product)/money/loans/loan-facts";
import { LoanProductRow } from "@/app/[locale]/(product)/money/loans/loan-product-row";
import { LoanSectionTitle } from "@/app/[locale]/(product)/money/loans/loan-section-title";
import { LoanDetailHero } from "@/modules/ledger/ui/loan-presentation";
import {
  LoanDueState,
  LoanStatus,
  LoanType,
} from "@/modules/ledger/application/loan-constants";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { moneyLoanPath } from "@/modules/tenancy/application/app-path";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import {
  BankIcon,
  BanknoteXIcon,
  Car01Icon,
  CreditCardIcon,
  GraduationCapIcon,
} from "@hugeicons/core-free-icons";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn() }),
}));

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ money: enMessages }}>
      <FinancialPrivacyProvider>{ui}</FinancialPrivacyProvider>
    </NextIntlClientProvider>,
  );
}

describe("Loan UI polish", () => {
  it("maps loan-type icons without treating tuition as a bank or BNPL as cash", () => {
    expect(loanTypeIcon(LoanType.BANK_LOAN)).toBe(BankIcon);
    expect(loanTypeIcon(LoanType.TUITION)).toBe(GraduationCapIcon);
    expect(loanTypeIcon(LoanType.BNPL)).toBe(CreditCardIcon);
    expect(loanTypeIcon(LoanType.VEHICLE)).toBe(Car01Icon);
    expect(loanTypeIcon(LoanType.OTHER)).toBe(BanknoteXIcon);
  });

  it("renders a loan as a navigable row with remaining principal and progress", () => {
    renderWithProviders(
      <LoanProductRow
        href={moneyLoanPath("loan-1")}
        testId="loan-row-loan-1"
        loanType={LoanType.BANK_LOAN}
        typeLabel="Bank loan"
        title="Home renovation"
        subtitle="Vietcombank · Bank loan"
        remainingAmount="₫80,000,000"
        monthlyLabel="Next payment"
        monthlyAmount="₫5,000,000"
        interestLabel="12% APR"
        dueState={LoanDueState.UPCOMING}
        dueLabel="Due 2026-10-01"
        nextDueAmount="₫5,000,000"
        progressLabel="20% paid"
        progressValue={0.2}
        progressAriaLabel="20% paid"
        status={LoanStatus.ACTIVE}
        statusLabel="Active"
        ownership={{
          financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
          isOwnedByMe: false,
        }}
      />,
    );

    const row = screen.getByTestId("loan-row-loan-1");
    expect(row).toHaveAttribute("href", moneyLoanPath("loan-1"));
    expect(row).toHaveAttribute("data-loan-status", LoanStatus.ACTIVE);
    expect(screen.getByText("Home renovation")).toBeInTheDocument();
    expect(screen.getByText("₫80,000,000")).toBeInTheDocument();
    expect(screen.getByText("20% paid")).toBeInTheDocument();
    expect(screen.getByText("Due 2026-10-01")).toBeInTheDocument();
  });

  it("groups loan facts in an elevated definition list", () => {
    renderWithProviders(
      <LoanFactsCard
        title="Loan terms"
        testId="loan-terms"
        footer={<LoanFactNote>Schedule ends 2029-09-06.</LoanFactNote>}
      >
        <LoanFactRow label="Term" value="36 months" />
      </LoanFactsCard>,
    );

    expect(screen.getByTestId("loan-terms")).toBeInTheDocument();
    expect(screen.getByText("Loan terms")).toBeInTheDocument();
    expect(screen.getByText("Term")).toBeInTheDocument();
    expect(screen.getByText("36 months")).toBeInTheDocument();
    expect(screen.getByText("Schedule ends 2029-09-06.")).toBeInTheDocument();
  });

  it("keeps a trailing privacy control on the loan detail hero", () => {
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
        trailing={<button type="button">Hide financial values</button>}
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

    expect(screen.getByTestId("loan-detail-hero")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hide financial values" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Remaining principal")).toBeInTheDocument();
    expect(screen.getByText("Next payment amount")).toBeInTheDocument();
    expect(screen.getByText("Due 2026-10-01")).toBeInTheDocument();
  });

  it("uses the quiet section title, not a second screen heading", () => {
    renderWithProviders(<LoanSectionTitle>Active loans</LoanSectionTitle>);
    const heading = screen.getByRole("heading", { name: "Active loans" });
    expect(heading.tagName).toBe("H2");
    expect(heading).toHaveClass("text-sm", "font-semibold");
  });

  it("keeps the loan finance icon on the debt concept", () => {
    expect(FINANCE_ICONS.loan).toBe(BankIcon);
  });
});
