import { Children, isValidElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatCurrency } from "@/shared/i18n/formatters";
import { APP_LOCALE } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { HOUSEHOLD_ROLE } from "@/modules/tenancy/application/tenancy-constants";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { getSessionMembership } from "@/modules/tenancy/application/get-session-membership";
import { redirect } from "@/i18n/navigation";
import {
  getSavingDetail,
  listProviderPackages,
  listSavingsEligibleAccounts,
  listSavingsFinancialActivities,
} from "@/modules/savings/application";
import {
  CycleStatus,
  InterestCalcMethod,
  PenaltyStrategy,
  RenewalPolicy,
  SavingStatus,
  SavingType,
  SettlementRule,
} from "@/modules/savings/application/savings-constants";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import {
  mapSavingRow,
  mapSavingCycleRow,
} from "@/modules/savings/application/savings-types";
import SavingsDetailPage from "@/app/[locale]/(product)/money/savings/[id]/page";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/i18n/set-locale", () => ({ setLocale: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({ redirect: vi.fn(), Link: () => null }));
vi.mock("@/modules/tenancy/application/get-session-membership", () => ({
  getSessionMembership: vi.fn(),
}));
vi.mock("@/modules/savings/application", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/savings/application")>()),
  getSavingDetail: vi.fn(),
  listProviderPackages: vi.fn(),
  listSavingsEligibleAccounts: vi.fn(),
  listSavingsFinancialActivities: vi.fn(),
}));

function detailFixture(
  status: SavingStatus = SavingStatus.ACTIVE,
  canMutate = true,
) {
  const saving = mapSavingRow(
    {
      id: "saving",
      household_id: "household",
      status,
      funding_account_id: "account",
      settlement_account_id: "account",
      provider_id: "provider",
      product_name: "My Saving",
      product_snapshot: {
        providerId: "provider",
        productName: "My Saving",
        packageName: "Package",
        depositTermDays: 90,
        annualInterestRate: 5,
        interestCalculationMethod: InterestCalcMethod.SIMPLE,
        settlementRule: SettlementRule.ROLL_PRINCIPAL_INTEREST,
        penaltyStrategy: PenaltyStrategy.NO_INTEREST,
        providerRules: {},
        currency: DEFAULT_CURRENCY,
      },
      renewal_policy: RenewalPolicy.ALWAYS_ASK,
      renewal_config: null,
      financial_scope: FINANCIAL_SCOPE.HOUSEHOLD,
      owner_membership_id: null,
      saving_providers: {
        display_name: "Provider",
        provider_key: "provider",
        saving_type: SavingType.BANK_DEPOSIT,
      },
      created_at: "2026-01-01",
    },
    "member",
  );
  saving.ownership.canMutate = canMutate;
  const cycle = mapSavingCycleRow({
    id: "cycle",
    saving_id: saving.id,
    cycle_number: 1,
    start_date: "2026-01-01",
    end_date: "2027-01-01",
    principal: 1000,
    locked_rate: 5,
    package_snapshot: {
      packageName: "Package",
      durationDays: 365,
      annualInterestRate: 5,
      settlementRules: [SettlementRule.ROLL_PRINCIPAL_INTEREST],
      penaltyRules: [],
      renewableAvailable: true,
      minAmount: null,
      maxAmount: null,
    },
    accrued_interest: 0,
    settlement_result: null,
    status:
      status === SavingStatus.MATURED
        ? CycleStatus.MATURED
        : CycleStatus.ACTIVE,
    funding_transaction_id: null,
    settlement_transaction_id: null,
    created_at: "2026-01-01",
  });
  saving.latestCycle = cycle;
  return { saving, cycles: [cycle] };
}

function pending<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

// Inspect the returned RSC shell without executing client components or async sections.
function elements(
  node: ReactNode,
): React.ReactElement<Record<string, unknown>>[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return [];
    return [child, ...elements(child.props.children)];
  });
}

async function deferredSections(node: ReactNode) {
  const sections = elements(node).filter(
    (element) =>
      typeof element.type === "function" &&
      element.type.constructor.name === "AsyncFunction",
  );
  return Promise.all(
    sections.map((section) => {
      const render = section.type as (
        props: Record<string, unknown>,
      ) => Promise<ReactNode>;
      return render(section.props);
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionMembership).mockResolvedValue({
    user: { id: "user" } as never,
    membership: {
      userId: "user",
      householdId: "household",
      membershipId: "member",
      role: HOUSEHOLD_ROLE.ADMIN,
    },
  });
  vi.mocked(getSavingDetail).mockResolvedValue(detailFixture());
  vi.mocked(listSavingsFinancialActivities).mockResolvedValue([]);
  vi.mocked(listProviderPackages).mockResolvedValue([]);
  vi.mocked(listSavingsEligibleAccounts).mockResolvedValue({
    currency: DEFAULT_CURRENCY,
    accounts: [],
  });
});

const props = {
  params: Promise.resolve({ locale: APP_LOCALE.ENGLISH, id: "saving" }),
};

describe("Saving Detail progressive RSC shell", () => {
  it.each([APP_LOCALE.ENGLISH, APP_LOCALE.VIETNAMESE])(
    "releases real financial summary in %s while references and activity remain pending",
    async (locale) => {
      const accounts =
        pending<Awaited<ReturnType<typeof listSavingsEligibleAccounts>>>();
      const packages =
        pending<Awaited<ReturnType<typeof listProviderPackages>>>();
      const activity =
        pending<Awaited<ReturnType<typeof listSavingsFinancialActivities>>>();
      vi.mocked(listSavingsEligibleAccounts).mockReturnValue(accounts.promise);
      vi.mocked(listProviderPackages).mockReturnValue(packages.promise);
      vi.mocked(listSavingsFinancialActivities).mockReturnValue(
        activity.promise,
      );
      const page = await SavingsDetailPage({
        params: Promise.resolve({ locale, id: "saving" }),
      });
      const shell = elements(page);
      expect(
        shell.some(
          (element) => element.props["data-testid"] === "savings-identity",
        ),
      ).toBe(true);
      expect(
        shell.some(
          (element) => element.props["data-testid"] === "savings-cycle-facts",
        ),
      ).toBe(true);
      expect(
        shell.some(
          (element) =>
            element.props.amountLabel ===
            formatCurrency(1000, DEFAULT_CURRENCY, locale, {
              maximumFractionDigits: 0,
            }),
        ),
      ).toBe(true);
      expect(shell.some((element) => element.props.savingId === "saving")).toBe(
        false,
      );
      expect(listSavingsEligibleAccounts).toHaveBeenCalledTimes(1);
      expect(listProviderPackages).toHaveBeenCalledTimes(1);
      expect(listSavingsFinancialActivities).toHaveBeenCalledTimes(1);
      const summary = shell.find(
        (element) => element.props["data-testid"] === "savings-identity",
      );
      packages.resolve([]);
      accounts.resolve({ currency: DEFAULT_CURRENCY, accounts: [] });
      activity.resolve([]);
      const resolved = await deferredSections(page);
      expect(
        resolved
          .flatMap(elements)
          .some((element) => element.props.savingId === "saving"),
      ).toBe(true);
      expect(
        elements(page).find(
          (element) => element.props["data-testid"] === "savings-identity",
        ),
      ).toEqual(summary);
    },
  );

  it("releases activity independently while action data remains pending", async () => {
    const accounts =
      pending<Awaited<ReturnType<typeof listSavingsEligibleAccounts>>>();
    vi.mocked(listSavingsEligibleAccounts).mockReturnValue(accounts.promise);
    const page = await SavingsDetailPage(props);
    const activity = elements(page).find(
      (element) =>
        typeof element.type === "function" &&
        element.type.name === "SavingFinancialActivity",
    );
    if (!activity) throw new Error("Expected the activity Server Component");
    const render = activity.type as (
      props: Record<string, unknown>,
    ) => Promise<ReactNode>;
    const result = await render(activity.props);
    expect(
      elements(result).some(
        (element) => element.props.children === "activityEmpty",
      ),
    ).toBe(true);
    accounts.resolve(null);
    await deferredSections(page);
  });

  it("does not create action forms when either reference read is unavailable", async () => {
    vi.mocked(listSavingsEligibleAccounts).mockResolvedValue(null);
    const page = await SavingsDetailPage(props);
    expect(
      (await deferredSections(page))
        .flatMap(elements)
        .some((element) => element.props.savingId === "saving"),
    ).toBe(false);
    vi.mocked(listSavingsEligibleAccounts).mockResolvedValue({
      currency: DEFAULT_CURRENCY,
      accounts: [],
    });
    vi.mocked(listProviderPackages).mockResolvedValue(null);
    expect(
      (await deferredSections(await SavingsDetailPage(props)))
        .flatMap(elements)
        .some((element) => element.props.savingId === "saving"),
    ).toBe(false);
  });

  it("keeps the critical invalid-target warning in the shell of a matured Saving", async () => {
    const detail = detailFixture(SavingStatus.MATURED);
    detail.saving.maturityActionRequired = true;
    vi.mocked(getSavingDetail).mockResolvedValue(detail);
    const accounts =
      pending<Awaited<ReturnType<typeof listSavingsEligibleAccounts>>>();
    vi.mocked(listSavingsEligibleAccounts).mockReturnValue(accounts.promise);
    const page = await SavingsDetailPage(props);
    expect(
      elements(page).some(
        (element) => element.props.title === "targetUnavailable",
      ),
    ).toBe(true);
    accounts.resolve(null);
    await deferredSections(page);
  });

  it("loads no action reference data for a Saving the current member cannot mutate", async () => {
    vi.mocked(getSavingDetail).mockResolvedValue(
      detailFixture(SavingStatus.MATURED, false),
    );
    const page = await SavingsDetailPage(props);
    expect(listProviderPackages).not.toHaveBeenCalled();
    expect(listSavingsEligibleAccounts).not.toHaveBeenCalled();
    expect(
      (await deferredSections(page))
        .flatMap(elements)
        .some((element) => element.props.cycleId === "cycle"),
    ).toBe(false);
  });

  it("preserves the unavailable page and does not load secondary data for a missing/unauthorized Saving", async () => {
    vi.mocked(getSavingDetail).mockResolvedValue(null);
    const page = await SavingsDetailPage(props);
    expect(page.props.testId).toBe("savings-detail-missing");
    expect(listSavingsFinancialActivities).not.toHaveBeenCalled();
    expect(listProviderPackages).not.toHaveBeenCalled();
    expect(listSavingsEligibleAccounts).not.toHaveBeenCalled();
  });

  it.each([APP_PATH.LOGIN, APP_PATH.ONBOARD])(
    "redirects rejected sessions to %s before any financial read",
    async (href) => {
      vi.mocked(getSessionMembership).mockResolvedValue({
        user: href === APP_PATH.LOGIN ? null : ({ id: "user" } as never),
        membership: null,
      });
      await SavingsDetailPage(props);
      expect(redirect).toHaveBeenCalledWith({
        href,
        locale: APP_LOCALE.ENGLISH,
      });
      expect(getSavingDetail).not.toHaveBeenCalled();
      expect(listSavingsEligibleAccounts).not.toHaveBeenCalled();
    },
  );
});
