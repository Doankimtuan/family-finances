import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  getSessionUser: vi.fn(),
  resolveActiveMembership: vi.fn(),
  listOpenInboxPage: vi.fn(),
  listArchivedInboxItems: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));
vi.mock("@/i18n/set-locale", () => ({ setLocale: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/modules/tenancy/application/get-session-user", () => ({
  getSessionUser: mocks.getSessionUser,
}));
vi.mock("@/modules/tenancy/application/resolve-active-membership", () => ({
  resolveActiveMembership: mocks.resolveActiveMembership,
}));
vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));
vi.mock("@/modules/inbox/application", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/inbox/application")>()),
  listOpenInboxPage: mocks.listOpenInboxPage,
  listArchivedInboxItems: mocks.listArchivedInboxItems,
}));

import InboxPage from "@/app/[locale]/(product)/inbox/page";
import { routing } from "@/i18n/routing";
import {
  INBOX_RPC,
  INBOX_READ_ONLY_BENCHMARK_ENABLED,
  INBOX_READ_ONLY_BENCHMARK_ENV,
  INBOX_TAB_QUERY,
  InboxQueueTab,
} from "@/modules/inbox/application/inbox-constants";

const queuePage = { items: [], nextCursor: null };

function configureRuntime(nodeEnvironment: string, benchmarkMode?: string) {
  vi.stubEnv("NODE_ENV", nodeEnvironment);
  vi.stubEnv(INBOX_READ_ONLY_BENCHMARK_ENV, benchmarkMode ?? "");
  if (benchmarkMode === undefined) {
    delete process.env[INBOX_READ_ONLY_BENCHMARK_ENV];
  }
}

async function renderOpenInbox() {
  return InboxPage({
    params: Promise.resolve({ locale: routing.defaultLocale }),
    searchParams: Promise.resolve({}),
  });
}

describe("Inbox GET maintenance safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUser.mockResolvedValue({ id: "user-1" });
    mocks.resolveActiveMembership.mockResolvedValue({
      membershipId: "membership-1",
      householdId: "household-1",
      userId: "user-1",
    });
    mocks.listOpenInboxPage.mockResolvedValue(queuePage);
    mocks.listArchivedInboxItems.mockResolvedValue([]);
    mocks.rpc.mockImplementation(async (procedure: string) => {
      if (procedure === INBOX_RPC.STALENESS_WORKER) {
        return { data: { expired_count: 0 }, error: null };
      }
      return {
        data: { refreshed_count: 0, archived_count: 0 },
        error: null,
      };
    });
    mocks.createSupabaseServerClient.mockResolvedValue({ rpc: mocks.rpc });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps both write callbacks scheduled in production", async () => {
    configureRuntime("production", INBOX_READ_ONLY_BENCHMARK_ENABLED);

    await renderOpenInbox();

    expect(mocks.after).toHaveBeenCalledOnce();
    const callback = mocks.after.mock.calls[0]?.[0];
    expect(callback).toBeTypeOf("function");
    if (typeof callback !== "function")
      throw new Error("Expected after callback");

    await callback();

    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    expect(mocks.rpc).toHaveBeenCalledWith(INBOX_RPC.STALENESS_WORKER);
    expect(mocks.rpc).toHaveBeenCalledWith(INBOX_RPC.SYNC_LOAN_DEBT_ATTENTION);
  });

  it("suppresses both callbacks only for the explicit local benchmark mode", async () => {
    configureRuntime("development", INBOX_READ_ONLY_BENCHMARK_ENABLED);

    await renderOpenInbox();

    expect(mocks.after).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.getSessionUser).toHaveBeenCalledOnce();
    expect(mocks.resolveActiveMembership).toHaveBeenCalledWith("user-1");
    expect(mocks.listOpenInboxPage).toHaveBeenCalledOnce();
  });

  it.each([
    ["development", undefined],
    ["development", "enabled"],
    ["test", INBOX_READ_ONLY_BENCHMARK_ENABLED],
    ["production", INBOX_READ_ONLY_BENCHMARK_ENABLED],
  ])(
    "fails closed for NODE_ENV=%s and benchmark setting %s",
    async (nodeEnvironment, benchmarkMode) => {
      configureRuntime(nodeEnvironment, benchmarkMode);

      await renderOpenInbox();

      expect(mocks.after).toHaveBeenCalledOnce();
    },
  );

  it("leaves queue and authorization reads identical in benchmark mode", async () => {
    configureRuntime("production");
    const productionPage = await renderOpenInbox();
    const productionReads = {
      session: mocks.getSessionUser.mock.calls,
      membership: mocks.resolveActiveMembership.mock.calls,
      queue: mocks.listOpenInboxPage.mock.calls,
    };

    vi.clearAllMocks();
    configureRuntime("development", INBOX_READ_ONLY_BENCHMARK_ENABLED);
    const benchmarkPage = await renderOpenInbox();

    expect(benchmarkPage).toBeTruthy();
    expect(mocks.getSessionUser.mock.calls).toEqual(productionReads.session);
    expect(mocks.resolveActiveMembership.mock.calls).toEqual(
      productionReads.membership,
    );
    expect(mocks.listOpenInboxPage.mock.calls).toEqual(productionReads.queue);
    expect(benchmarkPage).toEqual(productionPage);
    expect(productionPage).toBeTruthy();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("does not schedule maintenance for the archived GET route", async () => {
    configureRuntime("production");

    await InboxPage({
      params: Promise.resolve({ locale: routing.defaultLocale }),
      searchParams: Promise.resolve({
        [INBOX_TAB_QUERY]: InboxQueueTab.ARCHIVED,
      }),
    });

    expect(mocks.listArchivedInboxItems).toHaveBeenCalledOnce();
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
    expect(mocks.after).not.toHaveBeenCalled();
  });
});
