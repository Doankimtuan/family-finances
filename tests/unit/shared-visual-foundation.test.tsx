import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Section, SectionVariant } from "@/shared/patterns/section";
import { Balance, BalanceSize } from "@/shared/patterns/balance";
import { Amount, AmountTone, AmountSize } from "@/shared/patterns/amount";
import { Button } from "@/shared/ui/button";
import { FilterChip } from "@/shared/patterns/filter-chip";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AlertVariant } from "@/shared/ui/alert";
import { EmptyState } from "@/shared/patterns/empty-state";

describe("Shared Visual Foundation", () => {
  describe("Section & SectionHeader", () => {
    it("renders Section with title, description, and action", () => {
      render(
        <Section
          title="This period"
          description="Cash flow summary"
          action={<button type="button">View all</button>}
          testId="test-section"
        >
          <div>Section Content</div>
        </Section>,
      );

      expect(screen.getByTestId("test-section")).toBeInTheDocument();
      expect(screen.getByText("This period")).toBeInTheDocument();
      expect(screen.getByText("Cash flow summary")).toBeInTheDocument();
      expect(screen.getByText("Section Content")).toBeInTheDocument();
      const btn = screen.getByRole("button", { name: "View all" });
      expect(btn).toBeInTheDocument();
      expect(btn.parentElement?.className).toContain("[&_button]:min-h-11");
    });

    it("renders plain, surface, and emphasized semantics", () => {
      const { rerender } = render(
        <Section variant={SectionVariant.PLAIN} testId="var-sec">
          Content
        </Section>,
      );
      expect(screen.getByTestId("var-sec")).not.toHaveClass(
        "rounded-(--radius-card)",
        "bg-surface-muted/55",
      );

      rerender(
        <Section variant={SectionVariant.SURFACE} testId="var-sec">
          Content
        </Section>,
      );
      expect(screen.getByTestId("var-sec")).toHaveClass(
        "rounded-(--radius-card)",
        "bg-surface-muted/55",
      );

      rerender(
        <Section variant={SectionVariant.EMPHASIZED} testId="var-sec">
          Content
        </Section>,
      );
      expect(screen.getByTestId("var-sec")).toHaveClass(
        "rounded-(--radius-card)",
        "border-accent/20",
      );
    });
  });

  describe("Balance numeric contract", () => {
    it("renders dominant financial balance with tabular numerals and sizing", () => {
      const { rerender } = render(
        <Balance
          amountLabel="₫1,889,655"
          label="Total across accounts"
          size={BalanceSize.LG}
        />,
      );

      const balanceElem = screen.getByTestId("ledger-balance");
      expect(balanceElem).toHaveTextContent("₫1,889,655");
      expect(balanceElem).toHaveClass("tabular-nums", "text-3xl", "font-semibold");
      expect(screen.getByText("Total across accounts")).toBeInTheDocument();

      rerender(<Balance amountLabel="₫1,889,655" size={BalanceSize.HERO} />);
      expect(screen.getByTestId("ledger-balance")).toHaveClass("text-3xl");

      rerender(<Balance amountLabel="₫1,889,655" size={BalanceSize.MD} />);
      expect(screen.getByTestId("ledger-balance")).toHaveClass("text-xl");

      rerender(<Balance amountLabel="₫1,889,655" size={BalanceSize.SM} />);
      expect(screen.getByTestId("ledger-balance")).toHaveClass("text-lg");
    });
  });

  describe("Amount numeric contract", () => {
    it("renders intention amounts with tabular numerals and semantic tones", () => {
      const { rerender } = render(
        <Amount
          amountLabel="₫500,000"
          label="Planned savings"
          tone={AmountTone.SAVING}
          size={AmountSize.MD}
        />,
      );

      const amountElem = screen.getByTestId("intention-amount");
      expect(amountElem).toHaveTextContent("₫500,000");
      expect(amountElem).toHaveClass("tabular-nums", "text-saving", "text-xl");

      rerender(<Amount amountLabel="₫1,000,000" tone={AmountTone.CREDIT} />);
      expect(screen.getByTestId("intention-amount")).toHaveClass("text-success");

      rerender(<Amount amountLabel="₫200,000" tone={AmountTone.DEBIT} />);
      expect(screen.getByTestId("intention-amount")).toHaveClass("text-danger");

      rerender(<Amount amountLabel="₫300,000" tone={AmountTone.MUTED} />);
      expect(screen.getByTestId("intention-amount")).toHaveClass("text-text-secondary");
    });
  });

  describe("Button interaction contract", () => {
    it("enforces minimum hit targets and accessible names on buttons", () => {
      const { rerender } = render(<Button>Save changes</Button>);
      const btn = screen.getByRole("button", { name: "Save changes" });
      expect(btn).toHaveClass("min-h-11");
      expect(btn).toHaveAccessibleName("Save changes");

      rerender(
        <Button isIconOnly aria-label="Close dialog">
          ✕
        </Button>,
      );
      const iconBtn = screen.getByRole("button", { name: "Close dialog" });
      expect(iconBtn).toHaveClass("min-h-11", "min-w-11");
      expect(iconBtn).toHaveAccessibleName("Close dialog");
    });
  });

  describe("FilterChip interaction contract", () => {
    it("enforces 44px touch target, aria-pressed, and click handling", () => {
      const onPress = vi.fn();
      render(
        <FilterChip selected={true} onPress={onPress} data-testid="chip">
          Quarter
        </FilterChip>,
      );

      const chip = screen.getByTestId("chip");
      expect(chip).toHaveClass("min-h-11");
      expect(chip).toHaveAttribute("aria-pressed", "true");

      fireEvent.click(chip);
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("StatusBadge & StatusAlert", () => {
    it("renders StatusBadge with all semantic tones", () => {
      const { rerender } = render(
        <StatusBadge tone={StatusBadgeTone.POSITIVE} data-testid="badge">
          Positive flow
        </StatusBadge>,
      );
      expect(screen.getByTestId("badge")).toHaveClass("bg-success/10", "text-success");

      rerender(
        <StatusBadge tone={StatusBadgeTone.ATTENTION} data-testid="badge">
          Attention needed
        </StatusBadge>,
      );
      expect(screen.getByTestId("badge")).toHaveClass("bg-danger/10", "text-danger");

      rerender(
        <StatusBadge tone={StatusBadgeTone.WARNING} data-testid="badge">
          Due soon
        </StatusBadge>,
      );
      expect(screen.getByTestId("badge")).toHaveClass("bg-warning/10", "text-warning");

      rerender(
        <StatusBadge tone={StatusBadgeTone.INFO} data-testid="badge">
          Offline
        </StatusBadge>,
      );
      expect(screen.getByTestId("badge")).toHaveClass("bg-info/10", "text-info");
    });

    it("renders StatusAlert with action slot", () => {
      render(
        <StatusAlert
          variant={AlertVariant.WARNING}
          title="Offline mode"
          description="Changes will not be saved."
          action={<button type="button">Retry</button>}
          data-testid="status-alert"
        />,
      );

      expect(screen.getByTestId("status-alert")).toBeInTheDocument();
      expect(screen.getByText("Offline mode")).toBeInTheDocument();
      expect(screen.getByText("Changes will not be saved.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });
  });

  describe("EmptyState pattern", () => {
    it("renders normalized icon container radius and typography", () => {
      render(
        <EmptyState
          title="No pending items"
          description="All transactions categorized."
        />,
      );

      expect(screen.getByText("No pending items")).toBeInTheDocument();
      expect(screen.getByText("All transactions categorized.")).toBeInTheDocument();
      const title = screen.getByText("No pending items");
      expect(title).toHaveAttribute("data-slot", "empty-state-title");
    });
  });
});
