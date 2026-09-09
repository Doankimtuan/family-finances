import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en/money.json";
import { DebtDetailHero } from "@/app/[locale]/(product)/money/debts/debt-presentation";
import {
  DebtFactRow,
  DebtFactsCard,
} from "@/app/[locale]/(product)/money/debts/debt-facts";
import { DebtProductRow } from "@/app/[locale]/(product)/money/debts/debt-product-row";
import { DebtSectionTitle } from "@/app/[locale]/(product)/money/debts/debt-section-title";
import {
  DebtDirection,
  DebtDueState,
  DebtProgressState,
} from "@/modules/ledger/application";
import { OWNER_STATUS } from "@/modules/shared-kernel/application/financial-ownership";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

const dueLabels = {
  dueDate: (date: string) => `Due ${date}`,
  today: "Due today",
  daysLeft: (days: number) => `${days} days left`,
  daysOverdue: (days: number) => `${days} days overdue`,
  completed: "Completed",
};

const progressLabels = {
  paid: "Paid",
  received: "Received",
};

const due = {
  state: DebtDueState.DUE_SOON,
  daysUntilDue: 3,
};

const progress = {
  paidAmount: 400_000,
  remainingAmount: 600_000,
  percent: 40,
  state: DebtProgressState.IN_PROGRESS,
};

describe("Debt UI polish", () => {
  it("renders active records as grouped rows with a trailing chevron", () => {
    render(
      <DebtProductRow
        href="/money/debts/1"
        testId="debt-row-1"
        direction={DebtDirection.BORROWED}
        directionLabel="You owe"
        title="An"
        amountLabel="₫600,000"
        amountCaption="Still to repay"
        due={due}
        dueDate="2026-09-10"
        dueLabels={dueLabels}
        locale="en"
      />,
    );

    const row = screen.getByTestId("debt-row-1");
    expect(row.tagName).toBe("A");
    expect(row).toHaveAttribute("href", "/money/debts/1");
    expect(row).toHaveAttribute("data-financial-object", "debt");
    expect(row).toHaveAttribute("data-debt-direction", DebtDirection.BORROWED);
    expect(row).toHaveClass("hover:bg-surface-hover");
    expect(screen.getByText("An")).toHaveClass("truncate");
    expect(screen.getByText("You owe")).toBeInTheDocument();
    expect(screen.getByText("₫600,000")).toBeInTheDocument();
    expect(screen.getByText("Still to repay")).toBeInTheDocument();
    expect(screen.getByText("3 days left")).toBeInTheDocument();
    expect(row.querySelector("svg")).not.toBeNull();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("keeps a trailing privacy control on the detail hero caption row", () => {
    render(
      <FinancialPrivacyProvider>
        <DebtDetailHero
          direction={DebtDirection.BORROWED}
          remainingAmount={600_000}
          due={due}
          dueDate="2026-09-10"
          progress={progress}
          currency="VND"
          locale="en"
          directionLabel="You owe"
          trailing={<button type="button">Hide financial values</button>}
          context={<span>Household</span>}
          labels={{
            ...dueLabels,
            ...progressLabels,
            remainingToPay: "Still to repay",
            remainingToReceive: "Still to receive",
          }}
        />
      </FinancialPrivacyProvider>,
    );

    const hero = screen.getByTestId("debt-detail-hero");
    expect(hero).toHaveTextContent("Still to repay");
    expect(hero).toHaveTextContent("You owe");
    expect(screen.getByText("Household")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hide financial values" }),
    ).toBeInTheDocument();
  });

  it("groups detail facts in an elevated definition list", () => {
    render(
      <DebtFactsCard title="Details" testId="debt-detail-facts">
        <DebtFactRow label="Counterparty" value="An" />
        <DebtFactRow label="Original principal" value="₫1,000,000" emphasis />
      </DebtFactsCard>,
    );

    expect(screen.getByTestId("debt-detail-facts")).toBeInTheDocument();
    expect(screen.getByText("Details")).toHaveAttribute(
      "data-slot",
      "section-title",
    );
    expect(screen.getByText("Counterparty")).toBeInTheDocument();
    expect(screen.getByText("₫1,000,000")).toHaveClass("font-semibold");
  });

  it("keeps section titles quiet rather than a second screen heading", () => {
    render(<DebtSectionTitle>Active records</DebtSectionTitle>);
    const heading = screen.getByRole("heading", { name: "Active records" });
    expect(heading.tagName).toBe("H2");
    expect(heading).toHaveClass("text-sm", "font-semibold");
  });

  it("shows personal ownership on a row without changing household rows", () => {
    render(
      <NextIntlClientProvider locale="en" messages={{ money: enMessages }}>
        <DebtProductRow
          href="/money/debts/2"
          testId="debt-row-2"
          direction={DebtDirection.LENT}
          directionLabel="Owes you"
          title="Binh"
          amountLabel="₫200,000"
          amountCaption="Still to receive"
          due={{ state: DebtDueState.NONE, daysUntilDue: null }}
          dueDate={null}
          dueLabels={dueLabels}
          locale="en"
          ownership={{
            financialScope: FINANCIAL_SCOPE.PERSONAL,
            isOwnedByMe: true,
            ownerStatus: OWNER_STATUS.ACTIVE,
          }}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByTestId("debt-row-2")).toBeInTheDocument();
    expect(screen.getByText(/Personal/)).toBeInTheDocument();
  });
});
