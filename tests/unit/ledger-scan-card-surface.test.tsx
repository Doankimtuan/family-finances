import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MoneyAccountsScan } from "@/app/[locale]/(product)/money/money-accounts-scan";
import { AccountCard } from "@/modules/ledger/ui/account-card";
import { CreditCardCard } from "@/modules/ledger/ui/credit-card-card";
import {
  MoneyAccountGroupKey,
  MoneyCreditAttention,
} from "@/modules/ledger/application";
import {
  AccountHealthSignal,
  CARD_UTILIZATION_DANGER_PCT,
  CARD_UTILIZATION_WARN_PCT,
} from "@/modules/ledger/application/client";
import { OWNER_STATUS } from "@/modules/shared-kernel/application/financial-ownership";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { moneyAccountPath } from "@/modules/tenancy/application/app-path";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { IconContainerTone } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadgeTone } from "@/shared/ui/status-badge";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

const CARD_DEFAULT_SURFACE = [
  "rounded-[var(--radius-card)]",
  "bg-surface/90",
  "border-border-subtle/60",
  "shadow-none",
] as const;

const SCAN_INTERACTION_CLASSES = [
  "hover:border-border-default",
  "hover:bg-surface-hover",
  "active:scale-[var(--press-scale)]",
] as const;

function expectSharedDefaultCardSurface(element: HTMLElement) {
  expect(element).toHaveAttribute("data-slot", "card");
  expect(element).toHaveClass(...CARD_DEFAULT_SURFACE);
  expect(element).toHaveClass(...SCAN_INTERACTION_CLASSES);
  expect(element).not.toHaveClass("hover:-translate-y-px");
}

function CreditCardFixture(
  props: Partial<ComponentProps<typeof CreditCardCard>> = {},
) {
  return (
    <FinancialPrivacyProvider>
      <CreditCardCard
        title="Daily card"
        typeLabel="Credit card"
        outstandingCaption="Outstanding"
        outstandingLabel="800,000 ₫"
        availableCaption="Available credit"
        availableLabel="200,000 ₫"
        limitCaption="Credit limit"
        limitLabel="1,000,000 ₫"
        utilizationPct={20}
        utilizationLabel="20% used"
        {...props}
      />
    </FinancialPrivacyProvider>
  );
}

describe("Ledger scan card surface ownership (B13)", () => {
  it("lets the shared Card own AccountCard base surface classes", () => {
    const source = readProjectFile("modules/ledger/ui/account-card.tsx");

    expect(source).toContain('from "@/shared/patterns/card"');
    expect(source).toContain('tone="default"');
    expect(source).not.toContain("rounded-[var(--radius-card)]");
    expect(source).not.toContain("bg-surface/90");
    expect(source).not.toContain("border-border-subtle/60");
  });

  it("lets the shared Card own CreditCardCard base surface classes", () => {
    const source = readProjectFile("modules/ledger/ui/credit-card-card.tsx");

    expect(source).toContain('from "@/shared/patterns/card"');
    expect(source).toContain('tone="default"');
    expect(source).not.toContain("rounded-[var(--radius-card)]");
    expect(source).not.toContain("bg-surface/90");
    expect(source).not.toContain("border-border-subtle/65");
    expect(source).not.toContain("border-border-subtle/60");
  });

  it("renders AccountCard content on the shared default Card", () => {
    render(
      <AccountCard
        title="Daily cash"
        typeLabel="Cash"
        balanceCaption="Balance"
        balanceLabel="1,200,000 ₫"
        icon={FINANCE_ICONS.cash}
      />,
    );

    const card = screen.getByTestId("account-card");
    expectSharedDefaultCardSurface(card);
    expect(card).toHaveClass("flex", "min-h-11", "p-(--space-3)");
    expect(card).toHaveAttribute("data-financial-object", "account");
    expect(card).toHaveAttribute("data-surface", "soft-bounded");
    expect(screen.getByText("Daily cash")).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("1,200,000 ₫")).toBeInTheDocument();
  });

  it("keeps the zero-balance health treatment on AccountCard", () => {
    render(
      <AccountCard
        title="Empty cash"
        typeLabel="Cash"
        balanceCaption="Balance"
        balanceLabel="0 ₫"
        healthSignal={AccountHealthSignal.ZERO}
        healthLabel="Zero balance"
      />,
    );

    const card = screen.getByTestId("account-card");
    expectSharedDefaultCardSurface(card);
    expect(card).toHaveAttribute(
      "data-account-health",
      AccountHealthSignal.ZERO,
    );

    const health = screen.getByTestId("account-card-health");
    expect(health).toHaveTextContent("Zero balance");
    expect(health).toHaveClass("bg-warning/10", "text-warning");
  });

  it("renders CreditCardCard content on the shared default Card", () => {
    render(<CreditCardFixture />);

    const card = screen.getByTestId("credit-card-card");
    expectSharedDefaultCardSurface(card);
    expect(card).toHaveClass("flex", "min-h-11", "p-(--space-3)");
    expect(card).toHaveAttribute("data-financial-object", "credit-card");
    expect(card).toHaveAttribute("data-surface", "soft-bounded");
    expect(screen.getByText("Daily card")).toBeInTheDocument();
    expect(screen.getByText("Credit card")).toBeInTheDocument();
    expect(screen.getByText("Outstanding")).toBeInTheDocument();
    expect(screen.getByText("800,000 ₫")).toBeInTheDocument();
    expect(screen.getByText("Available credit")).toBeInTheDocument();
    expect(screen.getByText("Credit limit")).toBeInTheDocument();
  });

  it("keeps utilization and attention treatments on CreditCardCard", () => {
    render(
      <CreditCardFixture
        utilizationPct={CARD_UTILIZATION_DANGER_PCT}
        utilizationLabel="80% used"
        utilizationAriaLabel="80% of the card credit limit used"
        dueLabel="Due 12 Sep"
        attentionLabel="Overdue"
        attentionTone={StatusBadgeTone.ATTENTION}
      />,
    );

    const card = screen.getByTestId("credit-card-card");
    expectSharedDefaultCardSurface(card);
    expect(card).toHaveAttribute(
      "data-utilization",
      String(CARD_UTILIZATION_DANGER_PCT),
    );
    expect(screen.getByText("Due 12 Sep")).toBeInTheDocument();

    const indicator = card.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveClass("bg-danger");

    const attention = screen.getByText("Overdue");
    expect(attention).toHaveClass("bg-danger/10", "text-danger");
  });

  it("keeps the warning utilization fill below the danger threshold", () => {
    render(
      <CreditCardFixture
        utilizationPct={CARD_UTILIZATION_WARN_PCT}
        utilizationLabel="50% used"
      />,
    );

    const indicator = screen
      .getByTestId("credit-card-card")
      .querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveClass("bg-warning");
    expect(indicator).not.toHaveClass("bg-danger");
  });

  it("keeps Money scan rows wrapping the shared Card objects", () => {
    const cashGroups = [
      {
        key: MoneyAccountGroupKey.CASH,
        accounts: [
          {
            id: "cash-1",
            title: "Daily cash",
            typeLabel: "Cash",
            balanceCaption: "Balance",
            balanceLabel: "1,200,000 ₫",
            icon: FINANCE_ICONS.cash,
            iconTone: IconContainerTone.INCOME,
            financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
            isOwnedByMe: false,
            ownerStatus: OWNER_STATUS.ACTIVE,
          },
        ],
      },
    ];

    render(
      <MoneyAccountsScan
        labels={{
          sectionTitle: "Accounts",
          groupTitles: {
            [MoneyAccountGroupKey.CASH]: "Cash",
            [MoneyAccountGroupKey.BANK]: "Bank",
            [MoneyAccountGroupKey.WALLET]: "E-wallet",
            [MoneyAccountGroupKey.SAVINGS]: "Savings",
            [MoneyAccountGroupKey.INVESTMENT]: "Investments",
            [MoneyAccountGroupKey.OTHER]: "Other",
          },
          creditCardsTitle: "Credit cards",
          creditCardType: "Credit card",
          creditCardsHint: "Credit values stay separate.",
          outstanding: "Outstanding",
          availableCredit: "Available credit",
          creditLimit: "Credit limit",
          emptyTitle: "No accounts",
          emptyDescription: "Add an account.",
          showAll: "See all accounts",
          showLess: "Show fewer accounts",
          attentionLabels: {
            [MoneyCreditAttention.OVERDUE]: "Overdue",
            [MoneyCreditAttention.DUE_SOON]: "Due soon",
            [MoneyCreditAttention.HIGH_UTILIZATION]: "High use",
          },
        }}
        accountGroups={cashGroups}
        initialAccountGroups={cashGroups}
        accountPresentation="flat"
        hasMoreAccounts={false}
        creditCards={[
          {
            id: "card-1",
            title: "Daily card",
            outstandingLabel: "800,000 ₫",
            availableLabel: "200,000 ₫",
            limitLabel: "1,000,000 ₫",
            utilizationPct: CARD_UTILIZATION_DANGER_PCT,
            utilizationLabel: "80% used",
            utilizationAriaLabel: "80% of the card credit limit used",
            attention: MoneyCreditAttention.OVERDUE,
          },
        ]}
        createAction={<button type="button">Add account</button>}
      />,
    );

    const accountRow = screen.getByTestId("money-hub-account-row");
    const creditRow = screen.getByTestId("money-hub-credit-card-row");
    expect(accountRow).toHaveAttribute("href", moneyAccountPath("cash-1"));
    expect(creditRow).toHaveAttribute("href", moneyAccountPath("card-1"));

    expectSharedDefaultCardSurface(screen.getByTestId("account-card"));
    expectSharedDefaultCardSurface(screen.getByTestId("credit-card-card"));
    expect(screen.getByText("Overdue")).toHaveClass(
      "bg-danger/10",
      "text-danger",
    );
  });
});
