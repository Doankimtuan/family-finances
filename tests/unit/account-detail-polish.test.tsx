import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { TransactionRow } from "@/shared/patterns/transaction-row";
import { FinancialAccountHero } from "@/shared/patterns/financial-account-hero";
import { Button } from "@/shared/ui/button";
import { IconContainerTone } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { TransactionLedgerType } from "@/modules/ledger/application/ledger-constants";
import {
  isAccountActivityCredit,
  resolveAccountActivityLeading,
  resolveAccountIdentity,
} from "@/app/[locale]/(product)/money/accounts/[id]/account-detail-presentations";

describe("Account sheet and detail composition", () => {
  it("suppresses only the duplicate account type label", () => {
    expect(resolveAccountIdentity("Cash", "Cash")).toEqual({
      name: "Cash",
      typeLabel: null,
    });
    expect(resolveAccountIdentity("Grocery wallet", "Cash")).toEqual({
      name: "Grocery wallet",
      typeLabel: "Cash",
    });
  });

  it("keeps the Sheet body scroll owner separate from its footer", () => {
    render(
      <Sheet isOpen onOpenChange={() => {}}>
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading>Account</Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>Long form</ActionSheetLayout.Body>
          <ActionSheetLayout.Footer>
            <Button>Save</Button>
          </ActionSheetLayout.Footer>
        </ActionSheetLayout>
      </Sheet>,
    );

    const body = document.querySelector('[data-slot="action-sheet-body"]');
    const footer = document.querySelector('[data-slot="action-sheet-footer"]');
    expect(body).toHaveClass("min-h-0", "flex-1", "overflow-y-auto");
    expect(body).toHaveClass(
      "pb-[calc(var(--sheet-footer-clearance)+env(safe-area-inset-bottom,0px))]",
    );
    expect(footer).toHaveClass(
      "flex-none",
      "border-t",
      "pb-[calc(var(--sheet-footer-space)+env(safe-area-inset-bottom,0px))]",
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("renders transaction activity as a flat event row", () => {
    render(
      <TransactionRow
        title="Groceries"
        subtitle="Expense · 2026-08-19"
        amountLabel="−₫100,000"
      />,
    );

    const row = screen.getByText("Groceries").closest("div.group");
    expect(row).toHaveClass("border-b", "bg-transparent");
    expect(row).not.toHaveClass("rounded-[var(--radius-card)]");
  });

  it("keeps a trailing privacy control on the hero caption row", () => {
    render(
      <FinancialAccountHero
        icon={FINANCE_ICONS.cash}
        amountLabel="₫1,200,000"
        amountCaption="Balance"
        trailing={<button type="button">Hide financial values</button>}
      />,
    );

    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hide financial values" }),
    ).toBeInTheDocument();
  });

  it("maps activity leading visuals without treating debit as income", () => {
    expect(isAccountActivityCredit(TransactionLedgerType.INCOME)).toBe(true);
    expect(isAccountActivityCredit(TransactionLedgerType.EXPENSE)).toBe(false);

    const income = resolveAccountActivityLeading({
      type: TransactionLedgerType.INCOME,
      categoryId: null,
      categoryName: null,
    });
    expect(income.iconTone).toBe(IconContainerTone.INCOME);
    expect(income.icon).toBe(FINANCE_ICONS.income);

    const expense = resolveAccountActivityLeading({
      type: TransactionLedgerType.EXPENSE,
      categoryId: null,
      categoryName: null,
    });
    expect(expense.iconTone).toBe(IconContainerTone.EXPENSE);
    expect(expense.icon).toBe(FINANCE_ICONS.expense);
  });
});
