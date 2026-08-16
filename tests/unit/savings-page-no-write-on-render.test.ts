import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));
vi.mock("@/i18n/set-locale", () => ({ setLocale: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({
  Link: () => null,
  redirect: vi.fn(),
}));
vi.mock("@/modules/tenancy/application/get-session-user", () => ({
  getSessionUser: vi.fn(async () => ({ id: "user-1" })),
}));
vi.mock("@/modules/tenancy/application/resolve-active-membership", () => ({
  resolveActiveMembership: vi.fn(async () => ({ id: "membership-1" })),
}));
vi.mock("@/app/[locale]/(product)/money/money-offline-banner", () => ({
  MoneyOfflineBanner: () => null,
}));
vi.mock("@/app/[locale]/(product)/money/savings/savings-lifecycle-sync", () => ({
  SavingsLifecycleSync: () => null,
}));
vi.mock("@/modules/savings/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/modules/savings/application")>();
  return {
    ...actual,
    listSavings: vi.fn(),
    detectMaturedSavings: vi.fn(),
    backfillLegacySavingsAccounts: vi.fn(),
  };
});

import SavingsPage from "@/app/[locale]/(product)/money/savings/page";
import {
  listSavings,
  detectMaturedSavings,
  backfillLegacySavingsAccounts,
} from "@/modules/savings/application";

describe("Savings page render purity", () => {
  beforeEach(() => {
    vi.mocked(listSavings).mockResolvedValue([]);
  });

  it("renders the page without mutating savings lifecycle state", async () => {
    const page = await SavingsPage({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(page).toBeTruthy();
    expect(listSavings).toHaveBeenCalledTimes(1);
    expect(detectMaturedSavings).not.toHaveBeenCalled();
    expect(backfillLegacySavingsAccounts).not.toHaveBeenCalled();
  });
});
