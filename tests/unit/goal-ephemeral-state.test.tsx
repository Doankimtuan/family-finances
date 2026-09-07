import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateGoalForm } from "@/app/[locale]/(product)/plan/goals/create-goal-form";
import {
  GoalStatus,
  GoalType,
} from "@/modules/plan/application/plan-constants";
import { GoalDetailControls } from "@/app/[locale]/(product)/plan/goals/[id]/goal-detail-controls";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/shared/hooks/use-online-status", () => ({
  useOnlineStatusClient: () => ({ online: true }),
}));

vi.mock("@/providers/status-alert-provider", () => ({
  useStatusAlert: () => ({ show: vi.fn(), hide: vi.fn() }),
}));

vi.mock("@/app/[locale]/(product)/plan/goals/actions", () => ({
  createGoalAction: vi.fn(),
  linkGoalFundingAction: vi.fn(),
  changeGoalLifecycleAction: vi.fn(),
  contributeToGoalAction: vi.fn(),
  reassignGoalFundingSourceAction: vi.fn(),
  unlinkGoalFundingAction: vi.fn(),
  updateGoalAction: vi.fn(),
}));

describe("CreateGoalForm ephemeral state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("discards temporary create values when the sheet closes and reopens", () => {
    render(<CreateGoalForm fundingOptions={[]} />);

    fireEvent.click(screen.getByTestId("goal-create-open"));
    fireEvent.change(screen.getByLabelText("createNameLabel"), {
      target: { value: "Draft goal" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "type.save_up" }));
    fireEvent.click(screen.getByRole("button", { name: "createCancel" }));

    expect(screen.queryByTestId("goal-create-form")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("goal-create-open"));
    expect(screen.getByLabelText("createNameLabel")).toHaveValue("");
    expect(screen.getByRole("radio", { name: "type.save_up" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });
});

describe("GoalDetailControls edit ephemeral state", () => {
  const baseProps = {
    goalId: "goal-1",
    name: "Vacation",
    targetAmount: 1_000_000,
    fundedAmount: 250_000,
    progressPercent: 25,
    remainingPrincipal: null,
    targetDate: "2026-12-31",
    status: GoalStatus.ACTIVE,
    goalType: GoalType.SAVE_UP,
    fundingLinks: [],
    fundingOptions: [],
    reassignmentOptions: [],
    isLegacyIntention: false,
  };

  function openEditForm() {
    fireEvent.click(screen.getByTestId("goal-more-actions"));
    fireEvent.click(screen.getByTestId("goal-edit-open"));
  }

  it("restores persisted goal values when edit is closed without saving", () => {
    render(<GoalDetailControls {...baseProps} />);

    openEditForm();
    fireEvent.change(screen.getByLabelText("createNameLabel"), {
      target: { value: "Draft trip" },
    });
    fireEvent.click(screen.getByRole("button", { name: "createCancel" }));

    expect(screen.queryByTestId("goal-edit-form")).not.toBeInTheDocument();

    openEditForm();
    expect(screen.getByLabelText("createNameLabel")).toHaveValue("Vacation");
  });

  it("reopens edit from persisted data instead of abandoned local edits", () => {
    const { rerender } = render(<GoalDetailControls {...baseProps} />);

    openEditForm();
    fireEvent.change(screen.getByLabelText("createNameLabel"), {
      target: { value: "Abandoned draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "createCancel" }));

    rerender(
      <GoalDetailControls
        {...baseProps}
        name="Vacation"
        targetAmount={1_000_000}
        targetDate="2026-12-31"
      />,
    );

    openEditForm();
    expect(screen.getByLabelText("createNameLabel")).toHaveValue("Vacation");
    expect(screen.getByLabelText("createNameLabel")).not.toHaveValue(
      "Abandoned draft",
    );
  });
});
