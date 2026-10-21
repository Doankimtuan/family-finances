import {
  Suspense,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlanJarDetailPage from "@/app/[locale]/(product)/plan/jars/[id]/page";
import { JarDetailControls } from "@/app/[locale]/(product)/plan/jars/[id]/jar-detail-controls";
import { ReallocateJarForm } from "@/app/[locale]/(product)/plan/jars/reallocate-jar-form";
import { routing } from "@/i18n/routing";
import {
  DEFAULT_CURRENCY,
  TransactionDirection,
} from "@/modules/ledger/application/ledger-constants";
import {
  JarBudgetState,
  JarKind,
  JarPlanKind,
  JarState,
  QualifyingIncomeSource,
  type JarBudgetMetrics,
  type CurrentJarBudgetSummary,
} from "@/modules/plan/application";
import {
  IncomeAllocateMode,
  JarRolloverMode,
  RitualMode,
} from "@/modules/plan/application/plan-constants";
import type { JarDetail, PlanJar } from "@/modules/plan/application/jar-types";
import type { JarCategoryOption } from "@/modules/plan/application/queries/list-jar-categories";
import {
  getCurrentJarBudgets,
  listActiveJars,
  listJarCategories,
} from "@/modules/plan/application";
import { OverspendPolicy } from "@/modules/tenancy/application/household-policies.schema";
import type { HouseholdPolicies } from "@/modules/tenancy/application/get-household-policies";
import {
  HOUSEHOLD_ROLE,
  HOUSEHOLD_TIMEZONE,
} from "@/modules/tenancy/application/tenancy-constants";
import { getHouseholdPolicies } from "@/modules/tenancy/application/get-household-policies";
import { listOpenInboxItems } from "@/modules/inbox/application";
import { Amount } from "@/shared/patterns/amount";
import { Heading } from "@/shared/ui/heading";
import { Progress } from "@/shared/ui/progress";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  resolveActiveMembership: vi.fn(),
  getHouseholdPolicies: vi.fn(),
  getJar: vi.fn(),
  getCurrentJarBudgets: vi.fn(),
  listActiveJars: vi.fn(),
  listJarCategories: vi.fn(),
  listOpenInboxItems: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => {
    const translate = (key: string) => key;
    return Object.assign(translate, { rich: translate });
  }),
}));
vi.mock("@/i18n/set-locale", () => ({ setLocale: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({ redirect: vi.fn(), Link: () => null }));
vi.mock("@/modules/tenancy/application/get-session-user", () => ({
  getSessionUser: mocks.getSessionUser,
}));
vi.mock("@/modules/tenancy/application/resolve-active-membership", () => ({
  resolveActiveMembership: mocks.resolveActiveMembership,
}));
vi.mock("@/modules/tenancy/application/get-household-policies", () => ({
  getHouseholdPolicies: mocks.getHouseholdPolicies,
}));
vi.mock("@/modules/plan/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/modules/plan/application")>();
  return {
    ...actual,
    getJar: mocks.getJar,
    getCurrentJarBudgets: mocks.getCurrentJarBudgets,
    listActiveJars: mocks.listActiveJars,
    listJarCategories: mocks.listJarCategories,
  };
});
vi.mock("@/modules/inbox/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/modules/inbox/application")>();
  return { ...actual, listOpenInboxItems: mocks.listOpenInboxItems };
});

const USER_ID = "user-1";
const HOUSEHOLD_ID = "household-1";
const JAR_ID = "jar-1";
const OTHER_JAR_ID = "jar-2";
const PERIOD_MONTH = "2026-10-01";

const JAR: JarDetail = {
  id: JAR_ID,
  name: "Essentials",
  isNameCustom: true,
  kind: JarKind.SPENDING,
  state: JarState.ACTIVE,
  sortOrder: 0,
  capacityDelta: 0,
  rolloverMode: JarRolloverMode.CARRY,
  plan: {
    kind: JarPlanKind.FIXED,
    percentBps: 0,
    fixedAmount: 200_000,
  },
  householdId: HOUSEHOLD_ID,
  currency: DEFAULT_CURRENCY,
  incomeAllocateMode: IncomeAllocateMode.OFF,
};

const OTHER_JAR: PlanJar = {
  ...JAR,
  id: OTHER_JAR_ID,
  name: "Savings",
  sortOrder: 1,
};

const BUDGET_METRICS: JarBudgetMetrics = {
  budgetAmount: 200_000,
  spentAmount: 250_000,
  remainingAmount: -50_000,
  usagePercent: 125,
  state: JarBudgetState.OVERSPENT,
};

const BUDGETS: CurrentJarBudgetSummary = {
  pulse: {
    householdId: HOUSEHOLD_ID,
    currency: DEFAULT_CURRENCY,
    monthCloseMode: RitualMode.MANUAL,
    incomeAllocateMode: IncomeAllocateMode.OFF,
    activeJars: [JAR],
    pausedJarCount: 0,
    archivedJarCount: 0,
  },
  periodMonth: PERIOD_MONTH,
  periodIncome: 300_000,
  qualifyingIncome: 300_000,
  incomeSource: QualifyingIncomeSource.CONFIGURED,
  period: {
    month: PERIOD_MONTH,
    start: PERIOD_MONTH,
    end: "2026-10-31",
    endExclusive: "2026-11-01",
    timezone: HOUSEHOLD_TIMEZONE.VIETNAM,
  },
  byJarId: { [JAR_ID]: BUDGET_METRICS },
};

const ACTIVE_JARS = [JAR, OTHER_JAR];
const CATEGORIES: JarCategoryOption[] = [
  {
    id: "category-1",
    name: "Groceries",
    kind: TransactionDirection.EXPENSE,
    jarId: JAR_ID,
  },
];
const POLICIES: HouseholdPolicies = {
  householdId: HOUSEHOLD_ID,
  householdName: "Home",
  overspendPolicy: OverspendPolicy.BLOCK,
  monthCloseMode: RitualMode.MANUAL,
  incomeAllocateMode: IncomeAllocateMode.OFF,
  canEdit: true,
  role: HOUSEHOLD_ROLE.ADMIN,
};

type SearchableProps = {
  children?: ReactNode;
  fallback?: ReactNode;
  topBar?: ReactNode;
  primaryAction?: ReactNode;
  "data-testid"?: string;
  [key: string]: unknown;
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
    findElement(element.props.topBar, predicate) ??
    findElement(element.props.primaryAction, predicate)
  );
}

function findByTestId(node: ReactNode, testId: string) {
  return findElement(
    node,
    (element) => element.props["data-testid"] === testId,
  );
}

function findBoundary(node: ReactNode, childName: string) {
  const boundary = findElement(
    node,
    (element) =>
      element.type === Suspense &&
      isValidElement(element.props.children) &&
      typeof element.props.children.type === "function" &&
      element.props.children.type.name === childName,
  );
  if (!boundary || !isValidElement(boundary.props.children)) {
    throw new Error(`Expected Suspense boundary for ${childName}`);
  }
  const child = boundary.props.children as ReactElement<SearchableProps>;
  return {
    boundary,
    render: child.type as (props: SearchableProps) => Promise<ReactNode>,
    props: child.props,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function renderJarPage() {
  return PlanJarDetailPage({
    params: Promise.resolve({ locale: routing.defaultLocale, id: JAR_ID }),
  });
}

describe("Jar Detail progressive rendering promise contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUser.mockResolvedValue({ id: USER_ID });
    mocks.resolveActiveMembership.mockResolvedValue({
      householdId: HOUSEHOLD_ID,
      membershipId: "membership-1",
      userId: USER_ID,
      role: HOUSEHOLD_ROLE.ADMIN,
    });
    mocks.getHouseholdPolicies.mockResolvedValue(POLICIES);
    mocks.getJar.mockResolvedValue(JAR);
    mocks.getCurrentJarBudgets.mockResolvedValue(BUDGETS);
    mocks.listActiveJars.mockResolvedValue(ACTIVE_JARS);
    mocks.listJarCategories.mockResolvedValue(CATEGORIES);
    mocks.listOpenInboxItems.mockResolvedValue([]);
  });

  it("returns the authorized jar header while independent reads remain pending", async () => {
    const activeJars = deferred<Awaited<ReturnType<typeof listActiveJars>>>();
    const policies =
      deferred<Awaited<ReturnType<typeof getHouseholdPolicies>>>();
    const inboxItems =
      deferred<Awaited<ReturnType<typeof listOpenInboxItems>>>();
    const categories =
      deferred<Awaited<ReturnType<typeof listJarCategories>>>();
    const budgets =
      deferred<Awaited<ReturnType<typeof getCurrentJarBudgets>>>();
    mocks.listActiveJars.mockReturnValue(activeJars.promise);
    mocks.getHouseholdPolicies.mockReturnValue(policies.promise);
    mocks.listOpenInboxItems.mockReturnValue(inboxItems.promise);
    mocks.listJarCategories.mockReturnValue(categories.promise);
    mocks.getCurrentJarBudgets.mockReturnValue(budgets.promise);

    const page = await renderJarPage();

    expect(
      findElement(
        page,
        (element) => element.type === Heading && element.props.level === 1,
      )?.props.children,
    ).toBe(JAR.name);
    expect(findByTestId(page, "jar-budget-metrics")).toBeUndefined();
    expect(findByTestId(page, "jar-controls")).toBeUndefined();
    const financial = findBoundary(page, "JarFinancialContent");
    const actions = findBoundary(page, "JarDetailActionContent");
    expect(financial.props.budgetsPromise).toBe(actions.props.budgetsPromise);
    expect(mocks.getCurrentJarBudgets).toHaveBeenCalledTimes(1);
    expect(mocks.getJar).toHaveBeenCalledTimes(1);

    activeJars.resolve(ACTIVE_JARS);
    policies.resolve(POLICIES);
    inboxItems.resolve([]);
    categories.resolve(CATEGORIES);
    budgets.resolve(BUDGETS);
  });

  it("waits for authoritative budgets, then renders financial metrics while other reads remain pending", async () => {
    const activeJars = deferred<Awaited<ReturnType<typeof listActiveJars>>>();
    const policies =
      deferred<Awaited<ReturnType<typeof getHouseholdPolicies>>>();
    const inboxItems =
      deferred<Awaited<ReturnType<typeof listOpenInboxItems>>>();
    const categories =
      deferred<Awaited<ReturnType<typeof listJarCategories>>>();
    const budgets =
      deferred<Awaited<ReturnType<typeof getCurrentJarBudgets>>>();
    mocks.listActiveJars.mockReturnValue(activeJars.promise);
    mocks.getHouseholdPolicies.mockReturnValue(policies.promise);
    mocks.listOpenInboxItems.mockReturnValue(inboxItems.promise);
    mocks.listJarCategories.mockReturnValue(categories.promise);
    mocks.getCurrentJarBudgets.mockReturnValue(budgets.promise);

    const page = await renderJarPage();
    const financial = findBoundary(page, "JarFinancialContent");
    let financialReady = false;
    const financialPromise = financial
      .render(financial.props)
      .then((content) => {
        financialReady = true;
        return content;
      });
    await Promise.resolve();
    expect(financialReady).toBe(false);

    budgets.resolve(BUDGETS);
    const content = await financialPromise;
    const metrics = findByTestId(content, "jar-budget-metrics");
    const spent = findElement(
      content,
      (element) =>
        element.type === Amount && element.props.label === "spentLabel",
    );
    const overBy = findElement(
      content,
      (element) =>
        element.type === Amount && element.props.label === "overByHeading",
    );

    expect(metrics).toBeDefined();
    expect(spent?.props.amountLabel).toContain("250,000");
    expect(overBy?.props.amountLabel).toContain("50,000");
    expect(
      findElement(content, (element) => element.type === Progress)?.props.value,
    ).toBe(BUDGET_METRICS.usagePercent);
    expect(mocks.listActiveJars).toHaveBeenCalledTimes(1);
    expect(mocks.getHouseholdPolicies).toHaveBeenCalledTimes(1);
    expect(mocks.listOpenInboxItems).toHaveBeenCalledTimes(1);
    expect(mocks.listJarCategories).toHaveBeenCalledTimes(1);

    activeJars.resolve(ACTIVE_JARS);
    policies.resolve(POLICIES);
    inboxItems.resolve([]);
    categories.resolve(CATEGORIES);
  });

  it("renders category presentation as soon as categories resolve, independent of action references", async () => {
    const activeJars = deferred<Awaited<ReturnType<typeof listActiveJars>>>();
    const policies =
      deferred<Awaited<ReturnType<typeof getHouseholdPolicies>>>();
    mocks.listActiveJars.mockReturnValue(activeJars.promise);
    mocks.getHouseholdPolicies.mockReturnValue(policies.promise);

    const page = await renderJarPage();
    const category = findBoundary(page, "JarCategoryPresentation");
    const content = await category.render(category.props);

    expect(findByTestId(content, "jar-linked-categories")).toBeDefined();
    expect(
      findElement(content, (element) => element.type === Suspense),
    ).toBeDefined();

    activeJars.resolve(ACTIVE_JARS);
    policies.resolve(POLICIES);
  });

  it("keeps reallocation and edit controls pending until all action references resolve", async () => {
    const activeJars = deferred<Awaited<ReturnType<typeof listActiveJars>>>();
    const policies =
      deferred<Awaited<ReturnType<typeof getHouseholdPolicies>>>();
    const categories =
      deferred<Awaited<ReturnType<typeof listJarCategories>>>();
    const budgets =
      deferred<Awaited<ReturnType<typeof getCurrentJarBudgets>>>();
    mocks.listActiveJars.mockReturnValue(activeJars.promise);
    mocks.getHouseholdPolicies.mockReturnValue(policies.promise);
    mocks.listJarCategories.mockReturnValue(categories.promise);
    mocks.getCurrentJarBudgets.mockReturnValue(budgets.promise);

    const page = await renderJarPage();
    const actions = findBoundary(page, "JarDetailActionContent");
    let actionsReady = false;
    const actionsPromise = actions.render(actions.props).then((content) => {
      actionsReady = true;
      return content;
    });

    activeJars.resolve(ACTIVE_JARS);
    categories.resolve(CATEGORIES);
    budgets.resolve(BUDGETS);
    await Promise.resolve();
    expect(actionsReady).toBe(false);

    policies.resolve(POLICIES);
    const content = await actionsPromise;
    const controls = findElement(
      content,
      (element) => element.type === JarDetailControls,
    );
    const reallocation = findElement(
      content,
      (element) => element.type === ReallocateJarForm,
    );

    expect(controls?.props).toMatchObject({
      categories: CATEGORIES,
      availableJars: [{ id: OTHER_JAR_ID, name: OTHER_JAR.name }],
      qualifyingIncome: BUDGETS.qualifyingIncome,
    });
    expect(reallocation?.props).toMatchObject({
      availableToMove: 0,
      targetJars: [{ id: OTHER_JAR_ID, name: OTHER_JAR.name }],
      overspendPolicy: OverspendPolicy.BLOCK,
    });
    expect(mocks.getCurrentJarBudgets).toHaveBeenCalledTimes(1);
  });

  it("keeps missing and mismatched-household jars unavailable without starting secondary reads", async () => {
    mocks.getJar.mockResolvedValue(null);
    const missingPage = await renderJarPage();
    expect(findByTestId(missingPage, "plan-jar-hero")).toBeUndefined();

    mocks.getJar.mockResolvedValue({
      ...JAR,
      householdId: "another-household",
    });
    const mismatchedPage = await renderJarPage();
    expect(findByTestId(mismatchedPage, "plan-jar-hero")).toBeUndefined();
    expect(mocks.listActiveJars).not.toHaveBeenCalled();
    expect(mocks.getHouseholdPolicies).not.toHaveBeenCalled();
    expect(mocks.listOpenInboxItems).not.toHaveBeenCalled();
    expect(mocks.listJarCategories).not.toHaveBeenCalled();
    expect(mocks.getCurrentJarBudgets).not.toHaveBeenCalled();
  });

  it("keeps the jar visible and omits metrics when secondary reads are unavailable", async () => {
    mocks.getHouseholdPolicies.mockResolvedValue(null);
    mocks.getCurrentJarBudgets.mockResolvedValue(null);
    mocks.listActiveJars.mockResolvedValue(null);
    mocks.listJarCategories.mockResolvedValue(null);
    mocks.listOpenInboxItems.mockResolvedValue(null);

    const page = await renderJarPage();
    const financial = findBoundary(page, "JarFinancialContent");
    const action = findBoundary(page, "JarDetailActionContent");
    const financialContent = await financial.render(financial.props);
    const actionContent = await action.render(action.props);
    const controls = findElement(
      actionContent,
      (element) => element.type === JarDetailControls,
    );

    expect(
      findElement(
        page,
        (element) => element.type === Heading && element.props.level === 1,
      ),
    ).toBeDefined();
    expect(
      findByTestId(financialContent, "jar-budget-metrics"),
    ).toBeUndefined();
    expect(
      findElement(
        financialContent,
        (element) =>
          typeof element.type === "function" &&
          element.type.name === "JarIntentionHero",
      ),
    ).toBeDefined();
    expect(controls?.props).toMatchObject({
      categories: [],
      availableJars: [],
      qualifyingIncome: null,
    });
    expect(mocks.getCurrentJarBudgets).toHaveBeenCalledTimes(1);
  });
});
