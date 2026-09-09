import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreditCardHero } from "@/app/[locale]/(product)/money/accounts/[id]/credit-card-hero";
import { isCreditFacilityComplete } from "@/modules/ledger/ui/credit-facility-presentation";
import { CreditCardCard } from "@/modules/ledger/ui/credit-card-card";
import {
  CreditFacilityState,
  isCreditFacilityComplete,
} from "@/modules/ledger/ui/credit-facility-presentation";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { FINANCIAL_PRIVACY_MASK } from "@/shared/constants/financial-privacy";

describe("credit facility completeness", () => {
  it("treats a positive limit as complete and a zero limit as incomplete", () => {
    expect(isCreditFacilityComplete(30_000_000)).toBe(true);
    expect(isCreditFacilityComplete(0)).toBe(false);
  });
});

describe("credit-card liability-first presentation", () => {
  it("keeps owed amount primary and does not zero-fill an incomplete facility", () => {
    render(
      <CreditCardHero
        outstandingLabel="₫8,450,000"
        outstandingCaption="Current outstanding"
        outstandingAriaLabel="Amount currently owed"
        utilizationPct={null}
        utilizationLabel="No credit limit"
        availableLabel="Not available"
        availableCaption="Available credit"
        limitLabel="Not available"
        limitCaption="Credit limit"
        creditFacilityComplete={false}
      />,
    );

    const hero = screen.getByTestId("credit-card-hero");
    expect(hero).toHaveAttribute("data-financial-object", "credit-card");
    expect(hero).toHaveAttribute(
      "data-credit-facility",
      CreditFacilityState.INCOMPLETE,
    );
    expect(hero).toHaveAttribute("aria-label", "Amount currently owed");
    expect(screen.getByText("Current outstanding")).toBeInTheDocument();
    expect(screen.getByText("₫8,450,000")).toBeInTheDocument();
    expect(screen.getAllByText("Not available")).toHaveLength(2);
    expect(screen.queryByText("₫0")).not.toBeInTheDocument();
    expect(screen.getByText("No credit limit")).toBeInTheDocument();
  });

  it("does not describe owed money as available money", () => {
    render(
      <CreditCardHero
        outstandingLabel="₫8,450,000"
        outstandingCaption="Current outstanding"
        outstandingAriaLabel="Amount currently owed"
        utilizationPct={28}
        utilizationLabel="28% used"
        availableLabel="₫21,550,000"
        availableCaption="Available credit"
        limitLabel="₫30,000,000"
        limitCaption="Credit limit"
      />,
    );

    const hero = screen.getByTestId("credit-card-hero");
    expect(hero.getAttribute("aria-label")).not.toMatch(/available money/i);
    expect(hero.getAttribute("aria-label")).not.toMatch(/balance/i);
    expect(screen.getByText("Available credit")).toBeInTheDocument();
    expect(screen.getByText("Credit limit")).toBeInTheDocument();
  });

  it("does not mask unavailable facility copy when privacy is on", () => {
    window.localStorage.setItem("vinha.financial-values-hidden", "true");

    render(
      <FinancialPrivacyProvider>
        <CreditCardHero
          outstandingLabel="₫8,450,000"
          outstandingCaption="Current outstanding"
          utilizationPct={null}
          utilizationLabel="No credit limit"
          availableLabel="Not available"
          availableCaption="Available credit"
          limitLabel="Not available"
          limitCaption="Credit limit"
          creditFacilityComplete={false}
        />
      </FinancialPrivacyProvider>,
    );

    expect(screen.getByText("Current outstanding")).toBeInTheDocument();
    expect(screen.getByText(FINANCIAL_PRIVACY_MASK)).toBeInTheDocument();
    expect(screen.getAllByText("Not available")).toHaveLength(2);
    expect(document.body).not.toHaveTextContent("₫8,450,000");
  });

  it("keeps the shared card primitive from treating an incomplete limit as cash", () => {
    render(
      <CreditCardCard
        title="Visa"
        typeLabel="Credit card"
        outstandingCaption="Current outstanding"
        outstandingLabel="₫8,450,000"
        availableCaption="Available credit"
        availableLabel="Not available"
        limitCaption="Credit limit"
        limitLabel="Not available"
        utilizationPct={null}
        utilizationLabel="No credit limit"
        creditFacilityComplete={false}
      />,
    );

    expect(screen.getByTestId("credit-card-card")).toHaveAttribute(
      "data-financial-object",
      "credit-card",
    );
    expect(screen.getByText("Current outstanding")).toBeInTheDocument();
    expect(screen.getAllByText("Not available")).toHaveLength(2);
    expect(screen.queryByText("₫0")).not.toBeInTheDocument();
  });
});
