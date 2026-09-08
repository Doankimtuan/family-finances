import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((value: unknown) => value),
}));

vi.mock("@/i18n/set-locale", () => ({
  setLocale: vi.fn((locale: string) => locale),
}));
vi.mock("@/i18n/navigation", () => ({
  redirect: redirectMock,
}));
vi.mock("@/modules/tenancy/application/get-session-membership", () => ({
  getSessionMembership: vi.fn(),
}));

import { getSessionMembership } from "@/modules/tenancy/application/get-session-membership";
import { requireProductSession } from "@/modules/tenancy/application/require-product-session";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import {
  APP_PATH,
  HOUSEHOLD_ROLE,
  loginHrefWithNext,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import { routing } from "@/i18n/routing";

const user = { id: "user-1" };
const membership = {
  membershipId: "membership-1",
  householdId: "household-1",
  userId: "user-1",
  role: HOUSEHOLD_ROLE.ADMIN,
};

describe("requireProductSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated requests to login", async () => {
    vi.mocked(getSessionMembership).mockResolvedValue({
      user: null,
      membership: null,
    });

    await requireProductSession({ localeParam: routing.locales[0] });

    expect(redirectMock).toHaveBeenCalledWith({
      href: APP_PATH.LOGIN,
      locale: routing.locales[0],
    });
  });

  it("preserves locale and optional return path", async () => {
    vi.mocked(getSessionMembership).mockResolvedValue({
      user: null,
      membership: null,
    });

    await requireProductSession({
      localeParam: routing.locales[1],
      nextPath: APP_PATH.MONEY_INVESTMENTS_NEW,
    });

    expect(redirectMock).toHaveBeenCalledWith({
      href: loginHrefWithNext(APP_PATH.MONEY_INVESTMENTS_NEW),
      locale: routing.locales[1],
    });
  });

  it("falls back to the default locale for unknown locale params", async () => {
    vi.mocked(getSessionMembership).mockResolvedValue({
      user: null,
      membership: null,
    });

    await requireProductSession({ localeParam: "fr" });

    expect(redirectMock).toHaveBeenCalledWith({
      href: APP_PATH.LOGIN,
      locale: routing.defaultLocale,
    });
  });

  it("redirects authenticated users without a household to onboard", async () => {
    vi.mocked(getSessionMembership).mockResolvedValue({
      user: user as never,
      membership: null,
    });

    await requireProductSession({ localeParam: routing.locales[0] });

    expect(redirectMock).toHaveBeenCalledWith({
      href: APP_PATH.ONBOARD,
      locale: routing.locales[0],
    });
  });

  it("returns the session gate for authenticated members", async () => {
    vi.mocked(getSessionMembership).mockResolvedValue({
      user: user as never,
      membership,
    });

    await expect(
      requireProductSession({ localeParam: routing.locales[0] }),
    ).resolves.toEqual({
      locale: routing.locales[0],
      user,
      membership,
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("requireTogetherMembership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reuses the product session gate and keeps Together return-path semantics", async () => {
    vi.mocked(getSessionMembership).mockResolvedValue({
      user: null,
      membership: null,
    });

    await requireTogetherMembership({
      localeParam: routing.locales[0],
      nextPath: TOGETHER_PATH.SETTINGS,
    });

    expect(redirectMock).toHaveBeenCalledWith({
      href: loginHrefWithNext(TOGETHER_PATH.SETTINGS),
      locale: routing.locales[0],
    });
  });
});
