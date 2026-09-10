import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { JarCard } from "@/shared/patterns/jar-card";
import { GoalCard } from "@/shared/patterns/goal-card";
import { JarState } from "@/modules/plan/application/plan-constants";
import {
  FINANCIAL_PRIVACY_MASK,
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

describe("financial privacy output", () => {
  it("does not expose the raw value to accessibility output when hidden", () => {
    window.localStorage.setItem(
      FINANCIAL_PRIVACY_STORAGE_KEY,
      FINANCIAL_PRIVACY_STORAGE_TRUE,
    );

    render(
      <FinancialPrivacyProvider>
        <FinancialValue>12,345,678 ₫</FinancialValue>
      </FinancialPrivacyProvider>,
    );

    expect(screen.getByText(FINANCIAL_PRIVACY_MASK)).toBeInTheDocument();
    expect(screen.queryByText("12,345,678 ₫")).not.toBeInTheDocument();
    expect(screen.getByText(FINANCIAL_PRIVACY_MASK)).not.toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("fails closed for unclassified confirmation values", () => {
    window.localStorage.setItem(
      FINANCIAL_PRIVACY_STORAGE_KEY,
      FINANCIAL_PRIVACY_STORAGE_TRUE,
    );

    render(
      <FinancialPrivacyProvider>
        <ConfirmSummary
          rows={[{ id: "amount", label: "Amount", value: "99,000 ₫" }]}
        />
      </FinancialPrivacyProvider>,
    );

    expect(screen.queryByText("99,000 ₫")).not.toBeInTheDocument();
    expect(screen.getAllByText(FINANCIAL_PRIVACY_MASK).length).toBeGreaterThan(
      0,
    );
  });

  it("masks shared Jar and Goal financial leaves while keeping names and states", () => {
    window.localStorage.setItem(
      FINANCIAL_PRIVACY_STORAGE_KEY,
      FINANCIAL_PRIVACY_STORAGE_TRUE,
    );

    render(
      <FinancialPrivacyProvider>
        <JarCard
          name="Housing"
          kindLabel="Fixed"
          stateLabel="Active"
          state={JarState.ACTIVE}
          remainingLabel="6,000 ₫ remaining"
          usageLabel="40%"
          usagePercent={40}
        />
        <GoalCard
          name="Emergency fund"
          fundedLabel="4,000 ₫"
          targetLabel="10,000 ₫"
          progressPercent={40}
          statusLabel="Active"
        />
      </FinancialPrivacyProvider>,
    );

    expect(screen.getByText("Housing")).toBeInTheDocument();
    expect(screen.getByText("Emergency fund")).toBeInTheDocument();
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.queryByText("10,000 ₫")).not.toBeInTheDocument();
    expect(screen.getAllByText(FINANCIAL_PRIVACY_MASK).length).toBeGreaterThan(
      0,
    );
  });
});
