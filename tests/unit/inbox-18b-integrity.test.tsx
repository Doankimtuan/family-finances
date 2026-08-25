import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/navigation", () => ({ Link: () => null }));
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { ReviewCard } from "@/shared/patterns/review-card";
import {
  FINANCIAL_PRIVACY_MASK,
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";
import {
  InboxItemKind,
  InboxItemStatus,
  InboxSourceType,
} from "@/modules/inbox/application/inbox-constants";
import { DebtDueState } from "@/modules/ledger/application/debt-constants";
import { LoanDueState } from "@/modules/ledger/application/loan-constants";
import { mapInboxRow } from "@/modules/inbox/application/mappers/inbox-item.mapper";
import { resolveInboxSourceTarget } from "@/app/[locale]/(product)/inbox/inbox-source-link";
import {
  moneyDebtPath,
  moneyLoanPath,
} from "@/modules/tenancy/application/app-path";

describe("Inbox 18B privacy and navigation", () => {
  it("masks a queue-style monetary value without hiding context", () => {
    window.localStorage.setItem(
      FINANCIAL_PRIVACY_STORAGE_KEY,
      FINANCIAL_PRIVACY_STORAGE_TRUE,
    );

    render(
      <FinancialPrivacyProvider>
        <ReviewCard
          title="Loan payment attention"
          kindLabel="Overdue"
          amountLabel={<FinancialValue>125,000 ₫</FinancialValue>}
          actionLabel="Open loan"
        />
      </FinancialPrivacyProvider>,
    );

    expect(screen.getByText("Loan payment attention")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Open loan")).toBeInTheDocument();
    expect(screen.getByText(FINANCIAL_PRIVACY_MASK)).toBeInTheDocument();
    expect(screen.queryByText("125,000 ₫")).not.toBeInTheDocument();
  });

  it("routes Loan, Debt, and emi_complete source identities canonically", () => {
    const loanId = "550e8400-e29b-41d4-a716-446655440000";
    const debtId = "550e8400-e29b-41d4-a716-446655440001";
    const base = {
      id: "550e8400-e29b-41d4-a716-446655440002",
      status: InboxItemStatus.PENDING,
      title: "Attention",
      amount: 1000,
      currency: "VND",
      created_at: "2026-08-24T00:00:00Z",
      expires_at: null,
      auto_resolved: false,
      confidence_score: null,
      suggested_jar_id: null,
      suggested_category_id: null,
      assigned_to_user_id: null,
    };

    const loan = mapInboxRow({
      ...base,
      kind: InboxItemKind.LOAN_PAYMENT_ATTENTION,
      source_id: loanId,
      source_type: InboxSourceType.GUIDED,
      context_json: {
        loanId,
        dueState: LoanDueState.OVERDUE,
        dueDate: "2026-08-20",
      },
    });
    const debt = mapInboxRow({
      ...base,
      kind: InboxItemKind.DEBT_PAYMENT_ATTENTION,
      source_id: debtId,
      source_type: InboxSourceType.GUIDED,
      context_json: {
        debtId,
        dueState: DebtDueState.DUE_SOON,
        dueDate: "2026-08-27",
      },
    });
    const emi = mapInboxRow({
      ...base,
      kind: InboxItemKind.EMI_COMPLETE,
      source_id: loanId,
      source_type: InboxSourceType.GUIDED,
      context_json: { loanId },
    });

    expect(loan && resolveInboxSourceTarget(loan)).toMatchObject({
      href: moneyLoanPath(loanId),
    });
    expect(debt && resolveInboxSourceTarget(debt)).toMatchObject({
      href: moneyDebtPath(debtId),
    });
    expect(emi && resolveInboxSourceTarget(emi)).toMatchObject({
      href: moneyLoanPath(loanId),
    });
  });
});
