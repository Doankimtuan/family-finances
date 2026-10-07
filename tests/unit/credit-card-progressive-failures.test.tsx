import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { describe, expect, it, vi } from "vitest";
import { CreditCardActivitySection } from "@/app/[locale]/(product)/money/accounts/[id]/credit-card-activity-section";
import { CreditCardDetailActions } from "@/app/[locale]/(product)/money/accounts/[id]/credit-card-detail-actions";
import { CreditCardInstallmentsSection } from "@/app/[locale]/(product)/money/accounts/[id]/credit-card-installments-section";
import {
  AccountType,
  type CreditCardDetail,
} from "@/modules/ledger/application";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";

vi.mock("next-intl", () => ({
  useLocale: () => "vi",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/shared/hooks/use-online-status", () => ({
  useOnlineStatusClient: () => ({ online: true }),
}));

vi.mock("@/shared/ui/button", () => ({
  Button: ({
    children,
    isDisabled,
    "data-testid": testId,
  }: {
    children: ReactNode;
    isDisabled?: boolean;
    "data-testid"?: string;
  }) => (
    <button data-testid={testId} disabled={isDisabled}>
      {children}
    </button>
  ),
  ButtonVariant: { DANGER: "danger" },
}));

vi.mock("@/shared/patterns/sheet", () => ({
  Sheet: Object.assign(
    ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) =>
      isOpen ? <div>{children}</div> : null,
    { Heading: ({ children }: { children: ReactNode }) => <h2>{children}</h2> },
  ),
}));

vi.mock("@/app/[locale]/(product)/money/accounts/actions", () => ({
  registerCreditCardInstallmentAction: vi.fn(),
  stopCreditCardInstallmentTrackingAction: vi.fn(),
}));

const CARD_DETAIL: CreditCardDetail = {
  accountId: "account-test-id",
  name: "Test card",
  type: AccountType.CREDIT_CARD,
  creditLimit: 1_000_000,
  statementDay: 20,
  dueDay: 5,
  linkedBankAccountId: null,
  outstanding: 200_000,
  nextDueRemaining: 200_000,
  availableCredit: 800_000,
  utilizationPct: 20,
  nextDueDate: "2026-10-05",
  months: [],
};

describe("credit card deferred sections fail independently", () => {
  it("shows a billing-activity error instead of a false empty state", () => {
    render(
      <CreditCardActivitySection
        accountId={CARD_DETAIL.accountId}
        items={null}
        currency={DEFAULT_CURRENCY}
      />,
    );

    expect(screen.getByText("activityLoadErrorTitle")).toBeInTheDocument();
    expect(screen.queryByText("activityEmpty")).not.toBeInTheDocument();
  });

  it("fails closed when installments cannot be loaded", async () => {
    await act(async () => {
      render(
        <Suspense fallback={null}>
          <CreditCardInstallmentsSection
            cardAccountId={CARD_DETAIL.accountId}
            installmentsPromise={Promise.resolve(null)}
            eligiblePurchasesPromise={Promise.resolve([])}
            currency={DEFAULT_CURRENCY}
            presentation="quick-action"
          />
        </Suspense>,
      );
      await Promise.resolve();
    });

    expect(await screen.findByText("installmentError")).toBeInTheDocument();
    expect(
      screen.queryByTestId("card-installment-open"),
    ).not.toBeInTheDocument();
  });

  it("fails closed when eligible purchases cannot be verified", async () => {
    await act(async () => {
      render(
        <Suspense fallback={null}>
          <CreditCardInstallmentsSection
            cardAccountId={CARD_DETAIL.accountId}
            installmentsPromise={Promise.resolve([])}
            eligiblePurchasesPromise={Promise.resolve(null)}
            currency={DEFAULT_CURRENCY}
            presentation="quick-action"
          />
        </Suspense>,
      );
      await Promise.resolve();
    });

    expect(await screen.findByText("installmentError")).toBeInTheDocument();
    expect(
      screen.queryByTestId("card-installment-open"),
    ).not.toBeInTheDocument();
  });

  it("keeps payment disabled when account choices fail", async () => {
    await act(async () => {
      render(
        <Suspense fallback={null}>
          <CreditCardDetailActions
            card={CARD_DETAIL}
            liquidAccountsPromise={Promise.resolve(null)}
            currency={DEFAULT_CURRENCY}
            remainingDue={CARD_DETAIL.nextDueRemaining}
          />
        </Suspense>,
      );
      await Promise.resolve();
    });

    expect(await screen.findByTestId("card-payment-open")).toBeDisabled();
  });
});
