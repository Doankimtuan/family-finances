import {
  Suspense,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlanGoalDetailPage from "@/app/[locale]/(product)/plan/goals/[id]/page";
import { GoalDetailControls } from "@/app/[locale]/(product)/plan/goals/[id]/goal-detail-controls";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import type { GoalFundingOption } from "@/modules/plan/application/queries/list-goal-funding-options";
import type { GoalDetail } from "@/modules/plan/application/goal-recurring-types";
import {
  GoalBackingState,
  GoalFundingQuality,
  GoalFundingSourceKind,
  GoalFundingSourceType,
  GoalFundingValueStatus,
  GoalStatus,
  GoalType,
} from "@/modules/plan/application/plan-constants";
import {
  getGoal,
  listGoals,
} from "@/modules/plan/application/queries/list-goals";
import { listGoalFundingOptions } from "@/modules/plan/application/queries/list-goal-funding-options";
import { Amount } from "@/shared/patterns/amount";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { PlanUnavailable } from "@/app/[locale]/(product)/plan/plan-unavailable";
import { Progress } from "@/shared/ui/progress";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  resolveActiveMembership: vi.fn(),
  getGoal: vi.fn(),
  listGoals: vi.fn(),
  listGoalFundingOptions: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => {
    const translate = (key: string) => key;
    return Object.assign(translate, { rich: translate });
  }),
}));
vi.mock("@/i18n/set-locale", () => ({ setLocale: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/modules/tenancy/application/get-session-user", () => ({
  getSessionUser: mocks.getSessionUser,
}));
vi.mock("@/modules/tenancy/application/resolve-active-membership", () => ({
  resolveActiveMembership: mocks.resolveActiveMembership,
}));
vi.mock("@/modules/plan/application/queries/list-goals", () => ({
  getGoal: mocks.getGoal,
  listGoals: mocks.listGoals,
}));
vi.mock("@/modules/plan/application/queries/list-goal-funding-options", () => ({
  listGoalFundingOptions: mocks.listGoalFundingOptions,
}));

const GOAL_ID = "goal-1";
const GOAL = {
  id: GOAL_ID,
  name: "Emergency reserve",
  targetAmount: 1_000_000,
  fundedAmount: 250_000,
  progressPercent: 25,
  targetDate: null,
  status: GoalStatus.ACTIVE,
  goalType: GoalType.SAVE_UP,
  fundingLinks: [
    {
      id: "funding-link-1",
      kind: GoalFundingSourceKind.SAVINGS_ACCOUNT,
      sourceId: "account-1",
      sourceName: "Savings account",
      currentAmount: 250_000,
      valueStatus: GoalFundingValueStatus.CURRENT,
    },
  ],
  backingState: GoalBackingState.LINKED,
  fundingValueStatus: GoalFundingQuality.CURRENT,
  fundingSummary: {
    fundedAmount: 250_000,
    valueStatus: GoalFundingQuality.CURRENT,
    sources: [],
    marketValue: 250_000,
    costBasis: 0,
    unrealizedGainLoss: null,
    originalPrincipalTotal: 0,
    remainingPrincipalTotal: 0,
    principalPaidTotal: 0,
    incompleteSourceCount: 0,
    staleSourceCount: 0,
    missingSourceCount: 0,
    unknownSourceCount: 0,
    manualSourceCount: 0,
  },
  isLegacyIntention: false,
  householdId: "household-1",
  currency: "VND",
} satisfies GoalDetail;
const OTHER_GOAL = { ...GOAL, id: "goal-2", name: "Travel" };
const FUNDING_OPTION = {
  kind: GoalFundingSourceKind.SAVING,
  sourceId: "saving-1",
  name: "Term saving",
  currentAmount: 500_000,
  currency: "VND",
  sourceType: GoalFundingSourceType.SAVINGS,
  isAvailable: true,
  linkedGoalId: null,
  availability: "available",
} satisfies GoalFundingOption;

type SearchableProps = {
  children?: ReactNode;
  fallback?: ReactNode;
  topBar?: ReactNode;
  "data-testid"?: string;
};
type GoalActionProps = {
  goal: GoalDetail;
  fundingOptionsPromise: ReturnType<typeof listGoalFundingOptions>;
  listedGoalsPromise: ReturnType<typeof listGoals>;
};

function findElement(
  node: ReactNode,
  predicate: (element: ReactElement<SearchableProps>) => boolean,
): ReactElement<SearchableProps> | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, predicate);
      if (found) return found;
    }
    return undefined;
  }
  if (!isValidElement(node)) return undefined;

  const element = node as ReactElement<SearchableProps>;
  if (predicate(element)) return element;

  return (
    findElement(element.props.children, predicate) ??
    findElement(element.props.fallback, predicate) ??
    findElement(element.props.topBar, predicate)
  );
}

function findByTestId(node: ReactNode, testId: string) {
  return findElement(
    node,
    (element) => element.props["data-testid"] === testId,
  );
}

function findActionBoundary(node: ReactNode) {
  return findElement(
    node,
    (element) =>
      element.type === Suspense &&
      isValidElement(element.props.children) &&
      element.props.children.type !== GoalDetailControls,
  );
}

function getActionRenderer(node: ReactNode) {
  const boundary = findActionBoundary(node);
  if (!boundary || !isValidElement(boundary.props.children)) {
    throw new Error("Expected deferred goal action controls");
  }

  const actionElement = boundary.props
    .children as ReactElement<GoalActionProps>;
  if (typeof actionElement.type !== "function") {
    throw new Error("Expected an async goal action component");
  }

  return {
    boundary,
    renderActions: actionElement.type as (
      props: GoalActionProps,
    ) => Promise<ReactNode>,
    props: actionElement.props,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function renderGoalPage() {
  return PlanGoalDetailPage({
    params: Promise.resolve({ locale: routing.defaultLocale, id: GOAL_ID }),
  });
}

describe("Goal Detail progressive rendering promise contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUser.mockResolvedValue({ id: "user-1" });
    mocks.resolveActiveMembership.mockResolvedValue({ id: "membership-1" });
    mocks.getGoal.mockResolvedValue(GOAL);
    mocks.listGoalFundingOptions.mockResolvedValue([FUNDING_OPTION]);
    mocks.listGoals.mockResolvedValue({
      householdId: GOAL.householdId,
      currency: GOAL.currency,
      goals: [GOAL, OTHER_GOAL],
    });
  });

  it("returns the authoritative goal hero while funding options remain pending", async () => {
    const fundingOptions =
      deferred<Awaited<ReturnType<typeof listGoalFundingOptions>>>();
    mocks.listGoalFundingOptions.mockReturnValue(fundingOptions.promise);

    const page = await renderGoalPage();

    expect(findByTestId(page, "plan-goal-hero")).toBeDefined();
    expect(
      findByTestId(page, "goal-funding-source-funding-link-1"),
    ).toBeDefined();
    expect(mocks.listGoalFundingOptions).toHaveBeenCalledTimes(1);
    expect(mocks.listGoals).toHaveBeenCalledTimes(1);
    const actionBoundary = getActionRenderer(page).boundary;
    expect(actionBoundary.props.fallback).toBeNull();
    expect(
      findByTestId(
        actionBoundary.props.children,
        "goal-funding-source-funding-link-1",
      ),
    ).toBeUndefined();

    fundingOptions.resolve([FUNDING_OPTION]);
  });

  it("returns the goal hero while reassignment goals remain pending", async () => {
    const listedGoals = deferred<Awaited<ReturnType<typeof listGoals>>>();
    mocks.listGoals.mockReturnValue(listedGoals.promise);

    const page = await renderGoalPage();

    expect(findByTestId(page, "plan-goal-hero")).toBeDefined();
    expect(
      findByTestId(page, "goal-funding-source-funding-link-1"),
    ).toBeDefined();
    expect(mocks.listGoals).toHaveBeenCalledTimes(1);
    expect(getActionRenderer(page).boundary.props.fallback).toBeNull();

    listedGoals.resolve({
      householdId: GOAL.householdId,
      currency: GOAL.currency,
      goals: [GOAL, OTHER_GOAL],
    });
  });

  it("waits for getGoal before rendering any progress or starting action reads", async () => {
    const selectedGoal = deferred<GoalDetail | null>();
    mocks.getGoal.mockReturnValue(selectedGoal.promise);
    let pageRendered = false;
    const pagePromise = renderGoalPage().then((page) => {
      pageRendered = true;
      return page;
    });

    await vi.waitFor(() => expect(mocks.getGoal).toHaveBeenCalledTimes(1));
    expect(pageRendered).toBe(false);
    expect(mocks.listGoalFundingOptions).not.toHaveBeenCalled();
    expect(mocks.listGoals).not.toHaveBeenCalled();

    selectedGoal.resolve(GOAL);
    const page = await pagePromise;
    const progress = findElement(page, (element) => element.type === Progress);
    const fundedAmount = findElement(
      page,
      (element) => element.type === Amount,
    );

    expect(progress?.props.value).toBe(GOAL.progressPercent);
    expect(fundedAmount?.props.amountLabel).toContain("250,000");
  });

  it("keeps controls pending until both action reference reads settle", async () => {
    const fundingOptions =
      deferred<Awaited<ReturnType<typeof listGoalFundingOptions>>>();
    const listedGoals = deferred<Awaited<ReturnType<typeof listGoals>>>();
    mocks.listGoalFundingOptions.mockReturnValue(fundingOptions.promise);
    mocks.listGoals.mockReturnValue(listedGoals.promise);
    const page = await renderGoalPage();
    const { renderActions, props } = getActionRenderer(page);
    let controlsReady = false;
    const controlsPromise = renderActions(props).then((controls) => {
      controlsReady = true;
      return controls;
    });

    fundingOptions.resolve([FUNDING_OPTION]);
    await Promise.resolve();
    expect(controlsReady).toBe(false);

    listedGoals.resolve({
      householdId: GOAL.householdId,
      currency: GOAL.currency,
      goals: [GOAL, OTHER_GOAL],
    });
    const controls = await controlsPromise;
    const controlsElement = findElement(
      controls,
      (element) => element.type === GoalDetailControls,
    );

    expect(controlsReady).toBe(true);
    expect(controlsElement?.props).toMatchObject({
      fundingOptions: [FUNDING_OPTION],
      reassignmentOptions: [
        { id: OTHER_GOAL.id, name: OTHER_GOAL.name, goalType: GOAL.goalType },
      ],
    });
  });

  it("keeps a missing or unauthorized goal unavailable without starting secondary reads", async () => {
    mocks.getGoal.mockResolvedValue(null);

    const page = await renderGoalPage();

    expect(
      findElement(page, (element) => element.type === PlanUnavailable),
    ).toBeDefined();
    expect(mocks.listGoalFundingOptions).not.toHaveBeenCalled();
    expect(mocks.listGoals).not.toHaveBeenCalled();
  });

  it("does not offer link or reassignment references when secondary reads fail", async () => {
    mocks.listGoalFundingOptions.mockResolvedValue(null);
    mocks.listGoals.mockResolvedValue(null);
    const page = await renderGoalPage();
    const { renderActions, props } = getActionRenderer(page);
    const controls = await renderActions(props);
    const controlsElement = findElement(
      controls,
      (element) => element.type === GoalDetailControls,
    );

    expect(
      findByTestId(page, "goal-funding-source-funding-link-1"),
    ).toBeDefined();
    expect(controlsElement?.props).toMatchObject({
      fundingLinks: GOAL.fundingLinks,
      fundingOptions: [],
      reassignmentOptions: [],
    });
  });

  it("calls getGoal once and defers the existing all-goals query", async () => {
    const page = await renderGoalPage();
    const topBar = findElement(page, (element) => element.type === TopAppBar);

    expect(findByTestId(page, "plan-goal-hero")).toBeDefined();
    expect(getGoal).toHaveBeenCalledTimes(1);
    expect(listGoals).toHaveBeenCalledTimes(1);
    expect(topBar?.props.backHref).toBe(APP_PATH.PLAN_GOALS);
  });
});
