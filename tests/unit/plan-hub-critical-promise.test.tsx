import { Children, isValidElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PlanHubPage from "@/app/[locale]/(product)/plan/page";
import { APP_LOCALE } from "@/i18n/routing";
import { formatCurrency } from "@/shared/i18n/formatters";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import type { User } from "@supabase/supabase-js";
import {
  HOUSEHOLD_ROLE,
  HOUSEHOLD_TIMEZONE,
} from "@/modules/tenancy/application/tenancy-constants";
import { PLAN_MONTH_QUERY } from "@/modules/tenancy/application/app-path";
import { IncomeAllocateMode } from "@/modules/tenancy/application/household-policy-constants";
import {
  getHomeHouseholdContext,
  type HomeHouseholdContext,
} from "@/modules/tenancy/application/get-home-household-context";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getCurrentJarBudgets,
  getPlanBudgetHistory,
  getPlanPulse,
  JarBudgetState,
  JarKind,
  JarPlanKind,
  JarState,
  listPlanBudgetHistoryMonths,
  listPlanHubUpcomingEvents,
  QualifyingIncomeSource,
  RitualMode,
  type CurrentJarBudgetSummary,
  type PlanJar,
  type PlanPulse,
} from "@/modules/plan/application";
import { JarRolloverMode } from "@/modules/plan/application/plan-constants";
import { listOpenInboxItems } from "@/modules/inbox/application";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => {
    const translate = (key: string) => key;
    return Object.assign(translate, { rich: translate });
  }),
}));
vi.mock("@/i18n/set-locale", () => ({ setLocale: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({ redirect: vi.fn(), Link: () => null }));
vi.mock("@/modules/tenancy/application/get-session-user", () => ({
  getSessionUser: vi.fn(),
}));
vi.mock("@/modules/tenancy/application/resolve-active-membership", () => ({
  resolveActiveMembership: vi.fn(),
}));
vi.mock("@/modules/tenancy/application/get-home-household-context", () => ({
  getHomeHouseholdContext: vi.fn(),
}));
vi.mock("@/modules/plan/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/modules/plan/application")>();
  return {
    ...actual,
    getCurrentJarBudgets: vi.fn(),
    getPlanBudgetHistory: vi.fn(),
    getPlanPulse: vi.fn(),
    listPlanBudgetHistoryMonths: vi.fn(),
    listPlanHubUpcomingEvents: vi.fn(),
  };
});
vi.mock("@/modules/inbox/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/modules/inbox/application")>();
  return { ...actual, listOpenInboxItems: vi.fn() };
});

const USER_ID = "user-1";
const HOUSEHOLD_ID = "household-1";
const PERIOD_MONTH = "2026-10-01";
const JAR_ID = "jar-1";
const REQUEST_TIME = new Date("2026-10-11T00:00:00.000Z");
const sessionUser: User = {
  id: USER_ID,
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-10-11T00:00:00.000Z",
};
const householdContext: HomeHouseholdContext = {
  householdId: HOUSEHOLD_ID,
  householdName: "Household",
  locale: null,
  timezone: HOUSEHOLD_TIMEZONE.VIETNAM,
  baseCurrency: DEFAULT_CURRENCY,
  monthCloseMode: null,
  incomeAllocateMode: null,
  canEdit: false,
};

const activeJar: PlanJar = {
  id: JAR_ID,
  name: "Essentials",
  kind: JarKind.SPENDING,
  state: JarState.ACTIVE,
  sortOrder: 0,
  capacityDelta: 0,
  rolloverMode: JarRolloverMode.RESET,
  plan: {
    kind: JarPlanKind.FIXED,
    percentBps: 0,
    fixedAmount: 200_000,
  },
};

const pulse: PlanPulse = {
  householdId: HOUSEHOLD_ID,
  currency: DEFAULT_CURRENCY,
  monthCloseMode: RitualMode.MANUAL,
  incomeAllocateMode: IncomeAllocateMode.OFF,
  activeJars: [activeJar],
  pausedJarCount: 0,
  archivedJarCount: 0,
};

const currentJarBudgets: CurrentJarBudgetSummary = {
  pulse,
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
  byJarId: {
    [JAR_ID]: {
      budgetAmount: 200_000,
      spentAmount: 80_000,
      remainingAmount: 120_000,
      usagePercent: 40,
      state: JarBudgetState.HEALTHY,
    },
  },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function elements(
  node: ReactNode,
): React.ReactElement<Record<string, unknown>>[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return [];
    return [child, ...elements(child.props.children)];
  });
}

function section(page: ReactNode, name: string) {
  const found = elements(page).find(
    (element) =>
      typeof element.type === "function" && element.type.name === name,
  );
  if (!found) throw new Error(`Expected ${name} in Plan hub shell`);
  return found;
}

function renderSection(element: React.ReactElement<Record<string, unknown>>) {
  const render = element.type as (
    props: Record<string, unknown>,
  ) => Promise<ReactNode>;
  return render(element.props);
}

async function isSettled(promise: Promise<unknown>) {
  return Promise.race([
    promise.then(
      () => true,
      () => true,
    ),
    Promise.resolve(false),
  ]);
}

async function renderPeriodSelect(criticalTree: ReactNode) {
  const selectorTree = await renderSection(
    section(criticalTree, "PlanPeriodSelector"),
  );
  const select = elements(selectorTree).find(
    (element) =>
      typeof element.type === "function" &&
      element.type.name === "PlanPeriodSelect",
  );
  if (!select) throw new Error("Expected PlanPeriodSelect");
  return select;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(REQUEST_TIME);
  vi.mocked(getSessionUser).mockResolvedValue(sessionUser);
  vi.mocked(resolveActiveMembership).mockResolvedValue({
    userId: USER_ID,
    householdId: HOUSEHOLD_ID,
    membershipId: "membership-1",
    role: HOUSEHOLD_ROLE.ADMIN,
  });
  vi.mocked(getHomeHouseholdContext).mockResolvedValue(householdContext);
  vi.mocked(getPlanPulse).mockResolvedValue(pulse);
  vi.mocked(getCurrentJarBudgets).mockResolvedValue(currentJarBudgets);
  vi.mocked(getPlanBudgetHistory).mockResolvedValue(null);
  vi.mocked(listPlanBudgetHistoryMonths).mockResolvedValue([]);
  vi.mocked(listPlanHubUpcomingEvents).mockResolvedValue(null);
  vi.mocked(listOpenInboxItems).mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

function createPage(month?: string) {
  return PlanHubPage({
    params: Promise.resolve({ locale: APP_LOCALE.ENGLISH }),
    searchParams: Promise.resolve(
      month === undefined ? {} : { [PLAN_MONTH_QUERY]: month },
    ),
  });
}

describe("Plan hub progressive overview", () => {
  it("overlaps default-current reads with the household timezone lookup", async () => {
    const household = deferred<HomeHouseholdContext | null>();
    const householdStarted = deferred<void>();
    const budgetStarted = deferred<void>();
    vi.mocked(getHomeHouseholdContext).mockImplementation(() => {
      householdStarted.resolve();
      return household.promise;
    });
    vi.mocked(getCurrentJarBudgets).mockImplementation(() => {
      budgetStarted.resolve();
      return Promise.resolve(currentJarBudgets);
    });

    const page = await createPage();
    const critical = section(page, "PlanCriticalSection");
    const criticalResult = renderSection(critical);
    await Promise.all([householdStarted.promise, budgetStarted.promise]);

    expect(getCurrentJarBudgets).toHaveBeenCalledTimes(1);
    expect(getPlanPulse).not.toHaveBeenCalled();
    expect(await isSettled(criticalResult)).toBe(false);

    household.resolve(householdContext);
    await criticalResult;
  });

  it("falls back to the standalone pulse when current budgets are unavailable", async () => {
    vi.mocked(getCurrentJarBudgets).mockResolvedValue(null);

    const page = await createPage();
    await renderSection(section(page, "PlanCriticalSection"));

    expect(getCurrentJarBudgets).toHaveBeenCalledTimes(1);
    expect(getPlanPulse).toHaveBeenCalledTimes(1);
  });

  it("renders the financial summary and jars while Inbox remains pending", async () => {
    const inbox = deferred<Awaited<ReturnType<typeof listOpenInboxItems>>>();
    vi.mocked(listOpenInboxItems).mockReturnValue(inbox.promise);

    const page = await createPage();
    const critical = section(page, "PlanCriticalSection");
    const jars = section(page, "PlanJarsSection");
    const attention = section(page, "PlanAttentionSection");
    const [criticalTree, jarsTree] = await Promise.all([
      renderSection(critical),
      renderSection(jars),
    ]);
    const hero = elements(criticalTree).find(
      (element) =>
        typeof element.type === "function" &&
        element.type.name === "PlanHubHero",
    );
    const attentionResult = renderSection(attention);

    expect(hero?.props.plannedValue).toBe(
      formatCurrency(200_000, DEFAULT_CURRENCY, APP_LOCALE.ENGLISH, {
        maximumFractionDigits: 0,
      }),
    );
    expect(
      elements(jarsTree).some(
        (element) => element.props.testId === "plan-home-jars",
      ),
    ).toBe(true);
    expect(await isSettled(attentionResult)).toBe(false);

    inbox.resolve(null);
    await attentionResult;
    expect(listOpenInboxItems).toHaveBeenCalledTimes(1);
    expect(getCurrentJarBudgets).toHaveBeenCalledTimes(1);
  });

  it("renders finance while history options wait, then selects the correct month", async () => {
    const historyMonths =
      deferred<Awaited<ReturnType<typeof listPlanBudgetHistoryMonths>>>();
    vi.mocked(listPlanBudgetHistoryMonths).mockReturnValue(
      historyMonths.promise,
    );

    const page = await createPage();
    const criticalTree = await renderSection(
      section(page, "PlanCriticalSection"),
    );
    const jarsTree = await renderSection(section(page, "PlanJarsSection"));
    const selectorResult = renderSection(
      section(criticalTree, "PlanPeriodSelector"),
    );

    expect(
      elements(jarsTree).some(
        (element) => element.props.testId === "plan-home-jars",
      ),
    ).toBe(true);
    expect(await isSettled(selectorResult)).toBe(false);
    expect(getCurrentJarBudgets).toHaveBeenCalledTimes(1);

    historyMonths.resolve(["2026-09-01"]);
    const selectorTree = await selectorResult;
    const select = elements(selectorTree).find(
      (element) =>
        typeof element.type === "function" &&
        element.type.name === "PlanPeriodSelect",
    );

    expect(select?.props.selectedMonth).toBe(PERIOD_MONTH);
    expect(
      (select?.props.options as Array<{ value: string }>).map(
        (option) => option.value,
      ),
    ).toEqual([PERIOD_MONTH, "2026-09-01"]);
  });

  it("keeps the selected current month when history options are unavailable", async () => {
    const historyMonths =
      deferred<Awaited<ReturnType<typeof listPlanBudgetHistoryMonths>>>();
    vi.mocked(listPlanBudgetHistoryMonths).mockReturnValue(
      historyMonths.promise,
    );

    const page = await createPage();
    const criticalTree = await renderSection(
      section(page, "PlanCriticalSection"),
    );
    const jarsTree = await renderSection(section(page, "PlanJarsSection"));
    historyMonths.resolve(null);
    const select = await renderPeriodSelect(criticalTree);

    expect(select.props.selectedMonth).toBe(PERIOD_MONTH);
    expect(select.props.options).toEqual([
      expect.objectContaining({ value: PERIOD_MONTH }),
    ]);
    expect(
      elements(jarsTree).some(
        (element) => element.props.testId === "plan-home-jars",
      ),
    ).toBe(true);
  });

  it("keeps Summary and Jars pending together behind the single budget read", async () => {
    const budget = deferred<CurrentJarBudgetSummary | null>();
    const budgetStarted = deferred<void>();
    vi.mocked(getCurrentJarBudgets).mockImplementation(() => {
      budgetStarted.resolve();
      return budget.promise;
    });

    const page = await createPage();
    const critical = section(page, "PlanCriticalSection");
    const jars = section(page, "PlanJarsSection");
    const criticalResult = renderSection(critical);
    const jarsResult = renderSection(jars);
    await budgetStarted.promise;

    expect(critical.props.dataPromise).toBe(jars.props.dataPromise);
    expect(getCurrentJarBudgets).toHaveBeenCalledTimes(1);
    expect(await isSettled(criticalResult)).toBe(false);
    expect(await isSettled(jarsResult)).toBe(false);

    budget.resolve(currentJarBudgets);
    await Promise.all([criticalResult, jarsResult]);
  });

  it("keeps historical content snapshot-backed and skips current budget reads", async () => {
    const history =
      deferred<Awaited<ReturnType<typeof getPlanBudgetHistory>>>();
    const historyStarted = deferred<void>();
    vi.mocked(getPlanBudgetHistory).mockImplementation(() => {
      historyStarted.resolve();
      return history.promise;
    });

    const page = await createPage("2026-09-01");
    const criticalResult = renderSection(section(page, "PlanCriticalSection"));
    const jarsResult = renderSection(section(page, "PlanJarsSection"));
    await historyStarted.promise;

    expect(getCurrentJarBudgets).not.toHaveBeenCalled();
    expect(listOpenInboxItems).not.toHaveBeenCalled();
    expect(listPlanHubUpcomingEvents).not.toHaveBeenCalled();
    expect(getPlanBudgetHistory).toHaveBeenCalledWith(
      "2026-09-01",
      expect.any(Date),
      {
        timezone: HOUSEHOLD_TIMEZONE.VIETNAM,
        currency: DEFAULT_CURRENCY,
      },
    );
    expect(await isSettled(criticalResult)).toBe(false);
    expect(await isSettled(jarsResult)).toBe(false);

    history.resolve(null);
    const [criticalTree, jarsTree] = await Promise.all([
      criticalResult,
      jarsResult,
    ]);
    expect(
      elements(criticalTree).some(
        (element) => element.type.name === "PlanHubHero",
      ),
    ).toBe(false);
    expect(
      elements(criticalTree).some(
        (element) => element.props.title === "home.historyUnavailableTitle",
      ),
    ).toBe(true);
    expect(jarsTree).toBeNull();
  });

  it("classifies the selected month with the household timezone at a month boundary", async () => {
    vi.setSystemTime(new Date("2026-10-31T23:30:00.000Z"));
    vi.mocked(getHomeHouseholdContext).mockResolvedValue({
      ...householdContext,
      timezone: HOUSEHOLD_TIMEZONE.UTC,
    });

    const page = await createPage("2026-10-01");
    const criticalTree = await renderSection(
      section(page, "PlanCriticalSection"),
    );
    const select = await renderPeriodSelect(criticalTree);

    expect(select.props.selectedMonth).toBe(PERIOD_MONTH);
    expect(getCurrentJarBudgets).toHaveBeenCalledTimes(1);
    expect(getCurrentJarBudgets).toHaveBeenCalledWith(expect.any(Date));
    expect(getPlanBudgetHistory).not.toHaveBeenCalled();
  });

  it.each(["not-a-month", "2026-11-01"])(
    "treats invalid or future query month %s as the current period",
    async (month) => {
      const page = await createPage(month);
      const criticalTree = await renderSection(
        section(page, "PlanCriticalSection"),
      );
      const select = await renderPeriodSelect(criticalTree);

      expect(select.props.selectedMonth).toBe(PERIOD_MONTH);
      expect(getCurrentJarBudgets).toHaveBeenCalledTimes(1);
      expect(getPlanBudgetHistory).not.toHaveBeenCalled();
    },
  );

  it("starts upcoming independently from the financial result", async () => {
    const budget = deferred<CurrentJarBudgetSummary | null>();
    const budgetStarted = deferred<void>();
    const upcoming =
      deferred<Awaited<ReturnType<typeof listPlanHubUpcomingEvents>>>();
    const upcomingStarted = deferred<void>();
    vi.mocked(getCurrentJarBudgets).mockImplementation(() => {
      budgetStarted.resolve();
      return budget.promise;
    });
    vi.mocked(listPlanHubUpcomingEvents).mockImplementation(() => {
      upcomingStarted.resolve();
      return upcoming.promise;
    });

    const page = await createPage();
    const upcomingResult = renderSection(section(page, "PlanUpcomingSection"));
    const criticalResult = renderSection(section(page, "PlanCriticalSection"));
    await Promise.all([upcomingStarted.promise, budgetStarted.promise]);

    upcoming.resolve(null);
    await upcomingResult;
    expect(await isSettled(criticalResult)).toBe(false);

    budget.resolve(currentJarBudgets);
    await criticalResult;
    expect(listPlanHubUpcomingEvents).toHaveBeenCalledTimes(1);
  });
});
