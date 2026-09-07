import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import { HealthCard } from "@/shared/patterns/health-card";
import { KpiBlock, KpiBlockVariant } from "@/shared/patterns/kpi-block";
import {
  ReviewCard,
  ReviewCardDensity,
  REVIEW_CARD_TEST_ID,
} from "@/shared/patterns/review-card";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";

describe("Shared surface and overlay polish (B13)", () => {
  describe("ReviewCard", () => {
    it("uses the shared elevated Card surface for card density", () => {
      render(
        <ReviewCard
          title="Lunch"
          kindLabel="Unmapped expense"
          amountLabel="₫45,000"
          actionLabel="Open to decide"
        />,
      );

      const card = screen.getByTestId(REVIEW_CARD_TEST_ID.ROOT);
      expect(card).toHaveClass(
        "rounded-[var(--radius-card)]",
        "bg-surface",
        "border-border-subtle",
        "shadow-(--elevation-1)",
      );
      expect(card).toHaveTextContent("Lunch");
      expect(card).toHaveTextContent("Open to decide");
    });

    it("keeps row density as a list row without card chrome", () => {
      render(
        <ReviewCard
          density={ReviewCardDensity.ROW}
          title="Lunch"
          kindLabel="Unmapped expense"
          amountLabel="₫45,000"
        />,
      );

      const row = screen.getByTestId(REVIEW_CARD_TEST_ID.ROOT);
      expect(row).toHaveClass("min-h-14");
      expect(row).not.toHaveClass("rounded-[var(--radius-card)]");
      expect(row).not.toHaveClass("shadow-(--elevation-1)");
      expect(row).not.toHaveClass("border-border-subtle");
    });
  });

  describe("HealthCard", () => {
    it("uses the shared default Card surface when static", () => {
      render(<HealthCard title="Health" score={82} levelLabel="Good" />);

      const card = screen.getByTestId("health-card");
      expect(card).toHaveClass(
        "rounded-[var(--radius-card)]",
        "bg-surface/90",
        "border-border-subtle/60",
      );
      expect(card.tagName).not.toBe("BUTTON");
      expect(screen.getByText("82")).toBeInTheDocument();
    });

    it("keeps the pressable variant as a real button over the interactive Card", () => {
      const onPress = vi.fn();
      render(
        <HealthCard
          title="Health"
          score={82}
          levelLabel="Good"
          onPress={onPress}
        />,
      );

      const trigger = screen.getByRole("button", { name: /Health/ });
      expect(trigger).toHaveAttribute("data-testid", "health-card");
      fireEvent.click(trigger);
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(trigger.querySelector("[class*='bg-surface']")).not.toBeNull();
    });
  });

  describe("KpiBlock", () => {
    it("keeps the plain variant off the Card surface system", () => {
      render(
        <KpiBlock title="Cash in" variant={KpiBlockVariant.PLAIN}>
          <span>₫1,000</span>
        </KpiBlock>,
      );

      const block = screen.getByTestId("kpi-block");
      expect(block.tagName).toBe("SECTION");
      expect(block).not.toHaveClass("rounded-[var(--radius-card)]");
      expect(block).not.toHaveClass("bg-surface-muted/70");
    });

    it("uses the shared soft Card for the grouping surface variant", () => {
      render(
        <KpiBlock title="Cash in" variant={KpiBlockVariant.SURFACE}>
          <span>₫1,000</span>
        </KpiBlock>,
      );

      const block = screen.getByTestId("kpi-block");
      expect(block).toHaveClass(
        "rounded-[var(--radius-card)]",
        "bg-surface-muted/70",
        "border-border-subtle/70",
      );
    });

    it("keeps the prominent accent treatment on the shared Card radius", () => {
      render(
        <KpiBlock title="Attention" variant={KpiBlockVariant.PROMINENT}>
          <span>2 items</span>
        </KpiBlock>,
      );

      const block = screen.getByTestId("kpi-block");
      expect(block).toHaveClass(
        "rounded-[var(--radius-card)]",
        "border-accent/20",
        "bg-accent/10",
      );
    });
  });

  describe("ConfirmSummary", () => {
    it("uses the shared elevated Card without adding overlay elevation", () => {
      render(
        <FinancialPrivacyProvider>
          <ConfirmSummary
            data-testid="confirm-summary"
            rows={[
              { id: "amount", label: "Amount", value: "₫99,000" },
              { id: "note", label: "Note", value: "Settle now", kind: "text" },
            ]}
          />
        </FinancialPrivacyProvider>,
      );

      const summary = screen.getByTestId("confirm-summary");
      expect(summary).toHaveClass(
        "rounded-[var(--radius-card)]",
        "bg-surface",
        "border-border-subtle",
        "shadow-none",
      );
      expect(summary.querySelector("dl")).not.toBeNull();
      expect(screen.getByText("Amount")).toBeInTheDocument();
      expect(screen.getByText("Settle now")).toBeInTheDocument();
    });

    it("still allows a flattened in-panel override", () => {
      render(
        <FinancialPrivacyProvider>
          <ConfirmSummary
            className="border-0 bg-transparent p-0"
            data-testid="flat-summary"
            rows={[
              { id: "amount", label: "Amount", value: "₫1", kind: "text" },
            ]}
          />
        </FinancialPrivacyProvider>,
      );

      expect(screen.getByTestId("flat-summary")).toHaveClass(
        "border-0",
        "bg-transparent",
        "p-0",
      );
    });
  });
});
