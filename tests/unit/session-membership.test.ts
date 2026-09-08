import { readFileSync } from "node:fs";
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
        if (!store.has(key)) {
          store.set(key, fn(...args));
        }
        return store.get(key) as Result;
      };
    },
  };
});

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: requestCache.wrap,
  };
});

vi.mock("@/modules/platform/supabase/env", () => ({
  getSupabaseEnv: vi.fn(),
}));

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { getSessionMembership } from "@/modules/tenancy/application/get-session-membership";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { getVerifiedAuthSubject } from "@/modules/tenancy/application/get-verified-auth-subject";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  HOUSEHOLD_ROLE,
  MONEY_ACTION_DENIED_REASON,
} from "@/modules/tenancy/application/tenancy-constants";

const USER_ID = "user-1";
const OTHER_USER_ID = "user-2";

const membershipRow = {
  id: "membership-1",
  household_id: "household-1",
  role: HOUSEHOLD_ROLE.ADMIN,
  user_id: USER_ID,
};

const configuredEnv = {
  url: "https://example.supabase.co",
  key: "key",
  isConfigured: true,
};

function createClient(input: {
  claims?: { sub?: unknown } | null;
  claimsError?: { message: string } | null;
  user?: { id: string } | null;
  delayUser?: Promise<void>;
  membership?: typeof membershipRow | null;
  onMembershipStart?: () => void;
}) {
  const getClaims = vi.fn(async () => {
    if (input.claimsError) {
      return { data: null, error: input.claimsError };
    }
    if (!input.claims) {
      return { data: null, error: null };
    }
    return { data: { claims: input.claims }, error: null };
  });
  const getUser = vi.fn(async () => {
    if (input.delayUser) {
      await input.delayUser;
    }
    return { data: { user: input.user ?? null }, error: null };
  });
  const maybeSingle = vi.fn(async () => {
    input.onMembershipStart?.();
    return { data: input.membership ?? null, error: null };
  });
  const from = vi.fn(() => ({
    select: () => ({
      eq: () => ({
        eq: () => ({ maybeSingle }),
      }),
    }),
  }));

  return {
    auth: { getClaims, getUser },
    from,
    getClaims,
    getUser,
    maybeSingle,
  };
}

describe("getSessionMembership overlap", () => {
  beforeEach(() => {
    requestCache.beginRequest();
    vi.clearAllMocks();
    vi.mocked(getSupabaseEnv).mockReturnValue(configuredEnv);
  });

  it("starts membership from verified claims.sub without waiting for getUser", async () => {
    let releaseUser!: () => void;
    const delayUser = new Promise<void>((resolve) => {
      releaseUser = resolve;
    });
    let membershipStartedBeforeUser = false;
    let userResolved = false;

    const client = createClient({
      claims: { sub: USER_ID },
      user: { id: USER_ID },
      delayUser,
      membership: membershipRow,
      onMembershipStart: () => {
        membershipStartedBeforeUser = !userResolved;
      },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const pending = getSessionMembership();
    await vi.waitFor(() => expect(client.maybeSingle).toHaveBeenCalled());
    userResolved = true;
    releaseUser();

    await expect(pending).resolves.toEqual({
      user: { id: USER_ID },
      membership: {
        membershipId: membershipRow.id,
        householdId: membershipRow.household_id,
        userId: USER_ID,
        role: HOUSEHOLD_ROLE.ADMIN,
      },
    });
    expect(membershipStartedBeforeUser).toBe(true);
    expect(client.getUser).toHaveBeenCalledTimes(1);
    expect(client.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("does not authenticate from claims alone when getUser fails", async () => {
    const client = createClient({
      claims: { sub: USER_ID },
      user: null,
      membership: membershipRow,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    await expect(getSessionMembership()).resolves.toEqual({
      user: null,
      membership: null,
    });
    await expect(assertMoneyActionAllowed()).resolves.toEqual({
      ok: false,
      reason: MONEY_ACTION_DENIED_REASON.UNAUTHENTICATED,
    });
    expect(client.getUser).toHaveBeenCalled();
    expect(client.getClaims).toHaveBeenCalled();
  });

  it("does not resolve membership without a verified claims subject", async () => {
    const client = createClient({
      claims: {},
      user: { id: USER_ID },
      membership: membershipRow,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    await expect(getVerifiedAuthSubject()).resolves.toBeNull();
    await expect(getSessionMembership()).resolves.toEqual({
      user: null,
      membership: null,
    });
    expect(client.maybeSingle).not.toHaveBeenCalled();
    expect(client.getUser).toHaveBeenCalled();
  });

  it("fail-closes when claims.sub is empty", async () => {
    const client = createClient({
      claims: { sub: "" },
      user: { id: USER_ID },
      membership: membershipRow,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    await expect(getSessionMembership()).resolves.toEqual({
      user: null,
      membership: null,
    });
    expect(client.maybeSingle).not.toHaveBeenCalled();
  });

  it("fail-closes when no claims are present", async () => {
    const client = createClient({
      claims: null,
      user: { id: USER_ID },
      membership: membershipRow,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    await expect(getSessionMembership()).resolves.toEqual({
      user: null,
      membership: null,
    });
    expect(client.maybeSingle).not.toHaveBeenCalled();
  });

  it("fail-closes when getUser identity does not match claims.sub", async () => {
    const client = createClient({
      claims: { sub: USER_ID },
      user: { id: OTHER_USER_ID },
      membership: membershipRow,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    await expect(getSessionMembership()).resolves.toEqual({
      user: null,
      membership: null,
    });
    expect(client.maybeSingle).toHaveBeenCalled();
    await expect(assertMoneyActionAllowed()).resolves.toEqual({
      ok: false,
      reason: MONEY_ACTION_DENIED_REASON.UNAUTHENTICATED,
    });
  });

  it("deduplicates getUser and membership within one request", async () => {
    const client = createClient({
      claims: { sub: USER_ID },
      user: { id: USER_ID },
      membership: membershipRow,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    const [first, second, allowance] = await Promise.all([
      getSessionMembership(),
      getSessionMembership(),
      assertMoneyActionAllowed(),
    ]);
    const user = await getSessionUser();
    const membership = await resolveActiveMembership(USER_ID);

    expect(first).toEqual(second);
    expect(user).toEqual({ id: USER_ID });
    expect(membership?.membershipId).toBe(membershipRow.id);
    expect(allowance).toEqual({
      ok: true,
      userId: USER_ID,
      householdId: membershipRow.household_id,
      membershipId: membershipRow.id,
    });
    expect(client.getUser).toHaveBeenCalledTimes(1);
    expect(client.getClaims).toHaveBeenCalledTimes(1);
    expect(client.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("does not reuse session membership across requests", async () => {
    const firstClient = createClient({
      claims: { sub: USER_ID },
      user: { id: USER_ID },
      membership: membershipRow,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      firstClient as never,
    );
    await getSessionMembership();

    requestCache.beginRequest();
    const secondClient = createClient({
      claims: { sub: OTHER_USER_ID },
      user: { id: OTHER_USER_ID },
      membership: { ...membershipRow, user_id: OTHER_USER_ID },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      secondClient as never,
    );
    const second = await getSessionMembership();

    expect(second.user?.id).toBe(OTHER_USER_ID);
    expect(firstClient.getUser).toHaveBeenCalledTimes(1);
    expect(secondClient.getUser).toHaveBeenCalledTimes(1);
  });

  it("returns membership when claims, getUser, and household agree", async () => {
    const client = createClient({
      claims: { sub: USER_ID },
      user: { id: USER_ID },
      membership: membershipRow,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    await expect(assertMoneyActionAllowed()).resolves.toEqual({
      ok: true,
      userId: USER_ID,
      householdId: membershipRow.household_id,
      membershipId: membershipRow.id,
    });
  });

  it("keeps the overlap in the shared session helper used by product gates", () => {
    const session = readFileSync(
      "modules/tenancy/application/get-session-membership.ts",
      "utf8",
    );
    const gate = readFileSync(
      "modules/tenancy/application/require-product-session.ts",
      "utf8",
    );
    const allowance = readFileSync(
      "modules/tenancy/application/assert-money-action-allowed.ts",
      "utf8",
    );
    expect(session).toContain("getVerifiedAuthSubject");
    expect(session).toContain("Promise.all");
    expect(session).toContain("resolveActiveMembership(subject)");
    expect(gate).toContain("getSessionMembership");
    expect(gate).not.toContain("getSessionUser");
    expect(allowance).toContain("getSessionMembership");
  });
});
