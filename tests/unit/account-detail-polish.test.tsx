import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { TransactionRow } from "@/shared/patterns/transaction-row";
import { Button } from "@/shared/ui/button";
import { resolveAccountIdentity } from "@/app/[locale]/(product)/money/accounts/[id]/account-detail-presentations";

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
});
