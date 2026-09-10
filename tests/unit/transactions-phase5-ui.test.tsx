import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TransactionRow } from "@/shared/patterns/transaction-row";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { TransactionsFilterBar } from "@/app/[locale]/(product)/money/transactions/transactions-filter-bar";
import {
  TRANSACTION_TYPE_QUERY_PARAM,
  TransactionFilterType,
} from "@/modules/ledger/application/client";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";

const push = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

describe("Transactions scan-first presentation", () => {
  it("keeps amount sign visible and exposes movement text for assistive tech", () => {
    render(
      <TransactionRow
        title="Coffee shop"
        subtitle="Food · Cash"
        amountLabel="−₫85,000"
        amountMeta="Needs category"
        amountAriaLabel="Expense ₫85,000"
      />,
    );

    expect(screen.getByText("Coffee shop")).toBeInTheDocument();
    expect(screen.getByText("Food · Cash")).toBeInTheDocument();
    expect(screen.getByText("−₫85,000")).toBeInTheDocument();
    expect(screen.getByText("Needs category")).toBeInTheDocument();
    expect(screen.getByText("Expense ₫85,000")).toHaveClass("sr-only");
  });

  it("does not announce unmasked amounts when privacy is hidden", () => {
    window.localStorage.setItem(
      FINANCIAL_PRIVACY_STORAGE_KEY,
      FINANCIAL_PRIVACY_STORAGE_TRUE,
    );

    render(
      <FinancialPrivacyProvider>
        <TransactionRow
          title="Coffee shop"
          amountLabel="−₫85,000"
          amountAriaLabel="Expense ₫85,000"
        />
      </FinancialPrivacyProvider>,
    );

    expect(screen.getByText("Coffee shop")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("−₫85,000");
    expect(document.body).not.toHaveTextContent("Expense ₫85,000");
  });

  it("exposes selected filter chips and can clear through the list route", () => {
    render(
      <TransactionsFilterBar
        type={TransactionFilterType.EXPENSE}
        availableTags={[]}
        selectedTagIds={[]}
      />,
    );

    expect(screen.getByTestId("transactions-filter-expense")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("clearFilters")).toHaveAttribute(
      "href",
      APP_PATH.MONEY_TRANSACTIONS,
    );

    fireEvent.click(screen.getByTestId("transactions-filter-income"));
    expect(push).toHaveBeenCalledWith(
      `${APP_PATH.MONEY_TRANSACTIONS}?${TRANSACTION_TYPE_QUERY_PARAM}=income`,
    );
  });
});
