import { beforeEach, describe, expect, it, vi } from "vitest";
import { listSavingsEligibleAccounts } from "@/modules/savings/application/queries/list-savings-accounts";
import { listAccounts } from "@/modules/ledger/application";
import { getSessionMembership } from "@/modules/tenancy/application/get-session-membership";
import { redirect } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import NewSavingPage from "@/app/[locale]/(product)/money/savings/new/page";
import { listProviderCatalog } from "@/modules/savings/application";

vi.mock("@/modules/ledger/application", () => ({ listAccounts: vi.fn() }));
vi.mock("@/modules/savings/application", async () => ({
  listSavingsEligibleAccounts: (
    await import("@/modules/savings/application/queries/list-savings-accounts")
  ).listSavingsEligibleAccounts,
  listProviderCatalog: vi.fn(),
}));
vi.mock("@/modules/tenancy/application/get-session-membership", () => ({
  getSessionMembership: vi.fn(),
}));
vi.mock("@/i18n/set-locale", () => ({ setLocale: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock(
  "@/app/[locale]/(product)/money/savings/new/create-saving-wizard",
  () => ({ CreateSavingWizard: () => null }),
);
vi.mock(
  "@/app/[locale]/(product)/money/savings/new/create-saving-navigation",
  () => ({ CreateSavingTopAppBar: () => null }),
);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listProviderCatalog).mockResolvedValue([]);
  vi.mocked(getSessionMembership).mockResolvedValue({
    user: { id: "user" },
    membership: {
      id: "member",
      householdId: "household",
      userId: "user",
      role: "admin",
    },
  } as never);
});

describe("Create retains the existing eligible read model", () => {
  it("keeps mutable liquid accounts and excludes other users' personal accounts and ineligible types", async () => {
    const eligible = {
      id: "mine",
      type: "cash",
      canMutate: true,
      balance: 123,
    };
    vi.mocked(listAccounts).mockResolvedValue({
      currency: "VND",
      accounts: [
        eligible,
        { id: "partner", type: "checking", canMutate: false },
        { id: "archived-owner", type: "cash", canMutate: false },
        { id: "card", type: "credit_card", canMutate: true },
      ],
    } as never);
    expect(await listSavingsEligibleAccounts()).toEqual({
      currency: "VND",
      accounts: [eligible],
    });
  });
  it("preserves unavailable account data", async () => {
    vi.mocked(listAccounts).mockResolvedValue(null);
    expect(await listSavingsEligibleAccounts()).toBeNull();
  });
  it("releases the page without awaiting options, starting each read exactly once", async () => {
    let complete!: (value: null) => void;
    vi.mocked(listAccounts).mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    const page = await NewSavingPage({
      params: Promise.resolve({ locale: "en" }),
    });
    expect(page).toBeTruthy();
    expect(getSessionMembership).toHaveBeenCalledTimes(1);
    expect(listAccounts).toHaveBeenCalledTimes(1);
    expect(listProviderCatalog).toHaveBeenCalledTimes(1);
    complete(null);
  });
  it.each([
    [null, APP_PATH.LOGIN],
    [{ id: "user" }, APP_PATH.ONBOARD],
  ])("loads no options for a rejected session", async (user, href) => {
    vi.mocked(getSessionMembership).mockResolvedValue({
      user,
      membership: null,
    } as never);
    await NewSavingPage({ params: Promise.resolve({ locale: "vi" }) });
    expect(redirect).toHaveBeenCalledWith({ href, locale: "vi" });
    expect(listAccounts).not.toHaveBeenCalled();
    expect(listProviderCatalog).not.toHaveBeenCalled();
  });
});
