import { beforeEach, describe, expect, it, vi } from "vitest";

const requestCache = vi.hoisted(() => {
  let generation = 0;
  return {
    beginRequest: () => {
      generation += 1;
    },
    wrap<Args extends unknown[], Result>(fn: (...args: Args) => Result) {
      const store = new Map<string, Result>();
      let seenGeneration = -1;
      return (...args: Args): Result => {
        if (seenGeneration !== generation) {
          store.clear();
          seenGeneration = generation;
        }
        const key = JSON.stringify(args);
        if (!store.has(key)) store.set(key, fn(...args));
        return store.get(key) as Result;
      };
    },
  };
});

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: requestCache.wrap };
});

vi.mock("@/modules/platform/supabase/env", () => ({
  getSupabaseEnv: vi.fn(() => ({
    url: "https://example.supabase.co",
    key: "key",
    isConfigured: true,
  })),
}));

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/modules/tenancy/application/get-session-membership", () => ({
  getSessionMembership: vi.fn(),
}));

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { getSessionMembership } from "@/modules/tenancy/application/get-session-membership";
import { getHomeHouseholdContext } from "@/modules/tenancy/application/get-home-household-context";

const HOME_HOUSEHOLD = {
  name: "Home",
  locale: "en-VN",
  timezone: "Asia/Ho_Chi_Minh",
  base_currency: "VND",
  month_close_mode: "assisted",
  income_allocate_mode: "suggest",
};

function createHouseholdClient(data: typeof HOME_HOUSEHOLD) {
  const maybeSingle = vi.fn(async () => ({ data, error: null }));
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { from, maybeSingle, select, eq };
}

describe("getHomeHouseholdContext", () => {
  beforeEach(() => {
    requestCache.beginRequest();
    vi.clearAllMocks();
  });

  it("shares the exact field union once per request", async () => {
    vi.mocked(getSessionMembership).mockResolvedValue({
      user: { id: "user-1" },
      membership: {
        householdId: "household-1",
        userId: "user-1",
        membershipId: "membership-1",
        role: "admin",
      },
    } as never);
    const client = createHouseholdClient(HOME_HOUSEHOLD);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const [first, second] = await Promise.all([
      getHomeHouseholdContext(),
      getHomeHouseholdContext(),
    ]);

    expect(first).toEqual({
      householdId: "household-1",
      householdName: "Home",
      locale: "en-VN",
      timezone: "Asia/Ho_Chi_Minh",
      baseCurrency: "VND",
      monthCloseMode: "assisted",
      incomeAllocateMode: "suggest",
      canEdit: true,
    });
    expect(second).toEqual(first);
    expect(client.from).toHaveBeenCalledOnce();
    expect(client.select).toHaveBeenCalledWith(
      "name, locale, timezone, base_currency, month_close_mode, income_allocate_mode",
    );
    expect(client.eq).toHaveBeenCalledWith("id", "household-1");
  });

  it("does not reuse a context across requests", async () => {
    vi.mocked(getSessionMembership).mockResolvedValue({
      user: { id: "user-1" },
      membership: {
        householdId: "household-1",
        userId: "user-1",
        membershipId: "membership-1",
        role: "admin",
      },
    } as never);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      createHouseholdClient(HOME_HOUSEHOLD) as never,
    );
    const first = await getHomeHouseholdContext();

    requestCache.beginRequest();
    vi.mocked(getSessionMembership).mockResolvedValue({
      user: { id: "user-2" },
      membership: {
        householdId: "household-2",
        userId: "user-2",
        membershipId: "membership-2",
        role: "partner",
      },
    } as never);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      createHouseholdClient({ ...HOME_HOUSEHOLD, name: "Home 2" }) as never,
    );
    const second = await getHomeHouseholdContext();

    expect(first?.householdId).toBe("household-1");
    expect(second?.householdId).toBe("household-2");
    expect(second?.householdName).toBe("Home 2");
    expect(second?.canEdit).toBe(false);
  });
});
