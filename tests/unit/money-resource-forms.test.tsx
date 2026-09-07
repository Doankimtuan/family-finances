import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CreditCardSettleFlow } from "@/app/[locale]/(product)/money/accounts/[id]/credit-card-settle-flow";
import { LoanEditAction } from "@/app/[locale]/(product)/money/loans/[id]/loan-edit-action";
import { MoneyPaymentFlowStep } from "@/modules/ledger/application/client";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
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

vi.mock("@/app/[locale]/(product)/money/accounts/actions", () => ({
  settleCardAction: vi.fn(),
}));

vi.mock("@/app/[locale]/(product)/money/money-products-actions", () => ({
  updateLoanMetadataAction: vi.fn(),
}));

const CASH_ID = "11111111-1111-4111-8111-111111111111";
const BANK_ID = "22222222-2222-4222-8222-222222222222";

describe("credit card settlement form", () => {
  it("uses SelectField for the settlement source and a shared sheet footer", () => {
    render(
      <Sheet isOpen onOpenChange={() => {}}>
        <ActionSheetLayout>
          <CreditCardSettleFlow
            cardAccountId="card-1"
            cardName="Visa"
            outstanding={1_000_000}
            defaultPaymentAmount={500_000}
            liquidAccounts={[
              { id: CASH_ID, name: "Cash" },
              { id: BANK_ID, name: "Checking" },
            ]}
            linkedBankAccountId={BANK_ID}
            formatMoney={(amount) => String(amount)}
            onError={() => {}}
            errorCode={null}
            payStep={MoneyPaymentFlowStep.FORM}
            onPayStepChange={() => {}}
            onClose={() => {}}
          />
        </ActionSheetLayout>
      </Sheet>,
    );

    expect(
      screen
        .getByTestId("card-settle-source")
        .querySelector("[data-slot='select-value']")?.textContent,
    ).toBe("Checking");
    expect(screen.getByText("settleLiabilityHint")).toBeInTheDocument();
    expect(screen.getByTestId("card-settle-submit")).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="action-sheet-footer"]'),
    ).toBeInTheDocument();
    expect(
      document
        .querySelector('[data-slot="action-sheet-body"]')
        ?.querySelector('[data-slot="action-sheet-footer"]'),
    ).toBeNull();
  });
});

describe("loan edit form", () => {
  it("keeps the shared action footer outside the scrolling body", () => {
    render(
      <LoanEditAction
        loanId="loan-1"
        initialName="Home loan"
        initialLender="VCB"
        initialNote=""
      />,
    );

    fireEvent.click(screen.getByTestId("loan-edit-open"));

    expect(screen.getByTestId("loan-edit-form")).toBeInTheDocument();
    expect(screen.getByTestId("loan-edit-save")).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="action-sheet-footer"]'),
    ).toBeInTheDocument();
    expect(
      document
        .querySelector('[data-slot="action-sheet-body"]')
        ?.querySelector('[data-slot="action-sheet-footer"]'),
    ).toBeNull();
  });
});
