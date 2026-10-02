import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  APP_PATH,
  moneyTransactionCorrectPath,
  moneyTransactionEditPath,
  moneyTransactionPath,
  moneyTransactionRefundPath,
} from "@/modules/tenancy/application/app-path";
import { TABS } from "@/shared/patterns/bottom-navigation-tabs";

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "",
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/shared/hooks/use-online-status", () => ({
  useOnlineStatusClient: () => ({ online: true }),
}));

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("BottomNavigation foundation", () => {
  it("exposes four IA route tabs and excludes Health and Together", () => {
    expect(TABS).toHaveLength(4);
    expect(TABS.map((t) => t.href)).toEqual([
      APP_PATH.HOME,
      APP_PATH.MONEY,
      APP_PATH.PLAN,
      APP_PATH.INBOX,
    ]);
    expect(TABS.map((t) => t.labelKey)).toEqual([
      "home",
      "money",
      "plan",
      "inbox",
    ]);
    expect(TABS.some((t) => t.href === APP_PATH.HEALTH)).toBe(false);
    expect(TABS.map((t) => t.href)).not.toContain(APP_PATH.TOGETHER);
  });

  it("keeps an Inbox tab that can carry a badge count", () => {
    const inboxTab = TABS.find((t) => t.labelKey === "inbox");
    expect(inboxTab).toBeDefined();
    expect(inboxTab!.href).toBe(APP_PATH.INBOX);
  });

  it("keeps four route tabs and a centered transaction action", () => {
    const source = readProjectFile("shared/patterns/bottom-navigation.tsx");
    expect(source).toContain('data-slot="bottom-navigation"');
    expect(source).toContain("nav-tab-active-dot");
    expect(source).toContain("bg-warning");
    expect(source).toContain("bg-surface-elevated");
    expect(source).toContain("FloatingActionButton");
    expect(source).toContain("min-h-14");
    expect(source).toContain("aria-current");
    expect(source).toContain("useLinkStatus");
    expect(source).toContain("router.push(APP_PATH.MONEY_ADD)");
    expect(source).toContain("INBOX_BADGE_MAX_DISPLAY_COUNT");
    expect(source).not.toContain("min-[481px]:rounded");
    expect(source).not.toContain("min-[481px]:m-(--space-2)");
    expect(source).toContain('from "motion/react"');
  });
});

describe("BottomNavigation sub-route matching and standalone suppression", () => {
  it("resolves isPathInTab correctly across all tabs and sub-routes", async () => {
    const { isPathInTab } = await import("@/shared/patterns/bottom-navigation");

    // Home & Health
    expect(isPathInTab(APP_PATH.HOME, APP_PATH.HOME)).toBe(true);
    expect(isPathInTab(APP_PATH.HEALTH, APP_PATH.HOME)).toBe(true);
    expect(isPathInTab(APP_PATH.HEALTH_INSIGHTS, APP_PATH.HOME)).toBe(true);
    expect(isPathInTab(APP_PATH.HEALTH, APP_PATH.MONEY)).toBe(false);

    // Money sub-routes
    expect(isPathInTab(APP_PATH.MONEY, APP_PATH.MONEY)).toBe(true);
    expect(isPathInTab(APP_PATH.MONEY_ACCOUNTS, APP_PATH.MONEY)).toBe(true);
    expect(
      isPathInTab(`${APP_PATH.MONEY_ACCOUNTS}/acc-123`, APP_PATH.MONEY),
    ).toBe(true);
    expect(isPathInTab(APP_PATH.MONEY_TRANSACTIONS, APP_PATH.MONEY)).toBe(true);
    expect(isPathInTab(APP_PATH.MONEY_DEBTS, APP_PATH.MONEY)).toBe(true);
    expect(isPathInTab(APP_PATH.MONEY_LOANS, APP_PATH.MONEY)).toBe(true);
    expect(isPathInTab(APP_PATH.MONEY_SAVINGS, APP_PATH.MONEY)).toBe(true);
    expect(isPathInTab(APP_PATH.MONEY_INVESTMENTS, APP_PATH.MONEY)).toBe(true);

    // Plan sub-routes
    expect(isPathInTab(APP_PATH.PLAN, APP_PATH.PLAN)).toBe(true);
    expect(isPathInTab(APP_PATH.PLAN_GOALS, APP_PATH.PLAN)).toBe(true);
    expect(isPathInTab(`${APP_PATH.PLAN_GOALS}/goal-1`, APP_PATH.PLAN)).toBe(
      true,
    );
    expect(isPathInTab(APP_PATH.PLAN_RECURRING, APP_PATH.PLAN)).toBe(true);
    expect(isPathInTab(APP_PATH.PLAN_JARS, APP_PATH.PLAN)).toBe(true);
    expect(isPathInTab(APP_PATH.PLAN_CALENDAR, APP_PATH.PLAN)).toBe(true);

    // Inbox sub-routes
    expect(isPathInTab(APP_PATH.INBOX, APP_PATH.INBOX)).toBe(true);
    expect(isPathInTab(`${APP_PATH.INBOX}/item-1`, APP_PATH.INBOX)).toBe(true);
  });

  it("identifies standalone creation and mutation flows to hide bottom nav", async () => {
    const { isStandaloneFlowPath } =
      await import("@/shared/patterns/bottom-navigation");

    expect(isStandaloneFlowPath(APP_PATH.MONEY_ADD)).toBe(true);
    expect(isStandaloneFlowPath(APP_PATH.PLAN_RITUAL)).toBe(true);
    expect(isStandaloneFlowPath(APP_PATH.MONEY_SAVINGS_NEW)).toBe(true);
    expect(isStandaloneFlowPath(APP_PATH.MONEY_INVESTMENTS_NEW)).toBe(true);
    expect(isStandaloneFlowPath(APP_PATH.INVITATIONS_NEW)).toBe(true);
    expect(isStandaloneFlowPath(moneyTransactionEditPath("tx-1"))).toBe(true);
    expect(isStandaloneFlowPath(moneyTransactionCorrectPath("tx-1"))).toBe(
      true,
    );
    expect(isStandaloneFlowPath(moneyTransactionRefundPath("tx-1"))).toBe(true);

    // Normal paths should not be treated as standalone flows
    expect(isStandaloneFlowPath(APP_PATH.HOME)).toBe(false);
    expect(isStandaloneFlowPath(APP_PATH.MONEY)).toBe(false);
    expect(isStandaloneFlowPath(moneyTransactionPath("tx-1"))).toBe(false);
  });
});
