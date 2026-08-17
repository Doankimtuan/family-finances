import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  GoalStatus,
  GoalType,
} from "@/modules/plan/application/plan-constants";
import { GoalDetailControls } from "@/app/[locale]/(product)/plan/goals/[id]/goal-detail-controls";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/shared/hooks/use-online-status", () => ({
  useOnlineStatusClient: () => ({ online: true }),
}));
vi.mock("@/app/[locale]/(product)/plan/goals/actions", () => ({
  changeGoalLifecycleAction: vi.fn(),
  contributeToGoalAction: vi.fn(),
  linkGoalFundingAction: vi.fn(),
  reassignGoalFundingSourceAction: vi.fn(),
  unlinkGoalFundingAction: vi.fn(),
  updateGoalAction: vi.fn(),
}));

describe("GoalDetailControls progress integration", () => {
  it("uses the canonical goal progress value in completion copy", async () => {
    render(
      <GoalDetailControls
        goalId="goal-1"
        name="Goal"
        targetAmount={300}
        fundedAmount={1}
        progressPercent={0.33}
        remainingPrincipal={null}
        targetDate={null}
        status={GoalStatus.ACTIVE}
        goalType={GoalType.SAVE_UP}
        fundingLinks={[]}
        fundingOptions={[]}
        reassignmentOptions={[]}
        isLegacyIntention={false}
        fundingValueStatus="current"
      />,
    );

    fireEvent.click(screen.getByTestId("goal-complete"));

    expect(screen.getByTestId("goal-complete-confirm")).toHaveTextContent(
      'completeBelowTargetBody:{"percent":"0.33"}',
    );
  });
});
