import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GoalFundingSourcePicker } from "@/app/[locale]/(product)/plan/goals/goal-funding-source-picker";
import {
  GoalFundingSourceKind,
  GoalFundingSourceType,
} from "@/modules/plan/application/plan-constants";
import type { GoalFundingOption } from "@/modules/plan/application/queries/list-goal-funding-options";
import { goalFundingSourceKey } from "@/modules/plan/application/goal-funding";
import { DEFAULT_CURRENCY } from "@/modules/shared-kernel/currency";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";

function option(
  overrides: Partial<GoalFundingOption> &
    Pick<GoalFundingOption, "kind" | "sourceId" | "name" | "sourceType">,
): GoalFundingOption {
  return {
    currentAmount: 1_069_388,
    currency: DEFAULT_CURRENCY,
    isAvailable: true,
    linkedGoalId: null,
    availability: "available",
    ...overrides,
  };
}

function renderPicker(
  options: GoalFundingOption[],
  extras?: Partial<{
    selectedKey: string | null;
    searchLabel: string;
    searchPlaceholder: string;
    noMatchesLabel: string;
  }>,
) {
  const selected =
    extras?.selectedKey === undefined
      ? goalFundingSourceKey(options[1] ?? options[0])
      : extras.selectedKey;
  return render(
    <FinancialPrivacyProvider>
      <GoalFundingSourcePicker
        options={options}
        selectedKey={selected}
        onSelect={() => undefined}
        locale="vi"
        alreadyLinkedLabel="Already linked"
        groupLabel={(group) => group}
        aria-label="Funding source"
        searchLabel={extras?.searchLabel}
        searchPlaceholder={extras?.searchPlaceholder}
        noMatchesLabel={extras?.noMatchesLabel}
      />
    </FinancialPrivacyProvider>,
  );
}

describe("GoalFundingSourcePicker", () => {
  it("renders full-width rows so similar source names stay readable", () => {
    const first = option({
      kind: GoalFundingSourceKind.SAVING,
      sourceId: "saving-1",
      name: "Tikop 1 tháng của vợ",
      sourceType: GoalFundingSourceType.SAVINGS,
      currentAmount: 1_069_388,
    });
    const second = option({
      kind: GoalFundingSourceKind.SAVING,
      sourceId: "saving-2",
      name: "Tikop 2 tuần của vợ",
      sourceType: GoalFundingSourceType.SAVINGS,
      currentAmount: 5_050_932,
    });

    renderPicker([first, second]);

    const picker = screen.getByTestId("goal-funding-source-picker");
    expect(picker).toHaveAttribute("data-layout", "stack");
    expect(picker).not.toHaveClass("grid");
    expect(picker.querySelector(".grid-cols-2")).toBeNull();
    expect(screen.getByText("Tikop 1 tháng của vợ")).toBeVisible();
    expect(screen.getByText("Tikop 2 tuần của vợ")).toBeVisible();
    expect(screen.queryByLabelText("Find a source")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { checked: true })).toHaveAttribute(
      "data-testid",
      `goal-funding-option-${goalFundingSourceKey(second)}`,
    );
    const amounts = picker.querySelectorAll("[data-financial-kind]");
    expect(amounts).toHaveLength(2);
    expect(amounts[1]).toHaveAttribute(
      "data-financial-kind",
      FinancialNumberKind.CURRENT_STATE,
    );
    expect(amounts[1]?.textContent).toContain("5.050.932");
  });

  it("filters long similar lists by name without hiding unmatched group chrome", () => {
    const options = [
      option({
        kind: GoalFundingSourceKind.SAVING,
        sourceId: "saving-1",
        name: "Tikop 1 tháng của vợ",
        sourceType: GoalFundingSourceType.SAVINGS,
        currentAmount: 1_069_388,
      }),
      option({
        kind: GoalFundingSourceKind.SAVING,
        sourceId: "saving-2",
        name: "Tikop 2 tháng của vợ",
        sourceType: GoalFundingSourceType.SAVINGS,
        currentAmount: 2_133_728,
      }),
      option({
        kind: GoalFundingSourceKind.SAVING,
        sourceId: "saving-3",
        name: "Tikop 3 tháng của vợ",
        sourceType: GoalFundingSourceType.SAVINGS,
        currentAmount: 1_390_926,
      }),
      option({
        kind: GoalFundingSourceKind.SAVING,
        sourceId: "saving-4",
        name: "Tikop 2 tuần của vợ",
        sourceType: GoalFundingSourceType.SAVINGS,
        currentAmount: 1_578_886,
      }),
      option({
        kind: GoalFundingSourceKind.SAVING,
        sourceId: "saving-5",
        name: "Tikop 2 tuần của vợ",
        sourceType: GoalFundingSourceType.SAVINGS,
        currentAmount: 5_142_976,
      }),
      option({
        kind: GoalFundingSourceKind.SAVING,
        sourceId: "saving-6",
        name: "Tikop 3 tháng vợ",
        sourceType: GoalFundingSourceType.SAVINGS,
        currentAmount: 5_660_304,
      }),
    ];

    renderPicker(options, {
      searchLabel: "Find a source",
      searchPlaceholder: "Search by name or amount",
      noMatchesLabel: "No sources match that search.",
    });

    fireEvent.change(screen.getByLabelText("Find a source"), {
      target: { value: "tuần" },
    });

    expect(screen.queryByText("Tikop 1 tháng của vợ")).not.toBeInTheDocument();
    expect(screen.getAllByText("Tikop 2 tuần của vợ")).toHaveLength(2);
    expect(screen.getByText(/1\.578\.886/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Find a source"), {
      target: { value: "xyz-not-a-source" },
    });
    expect(
      screen.getByText("No sources match that search."),
    ).toBeInTheDocument();
  });
});
