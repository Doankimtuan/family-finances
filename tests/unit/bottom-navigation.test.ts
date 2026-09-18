import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { TABS } from "@/shared/patterns/bottom-navigation-tabs";

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "",
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("BottomNavigation foundation", () => {
  it("exposes exactly five IA tabs and excludes Health", () => {
    expect(TABS).toHaveLength(5);
    expect(TABS.map((t) => t.href)).toEqual([
      APP_PATH.HOME,
      APP_PATH.MONEY,
      APP_PATH.PLAN,
      APP_PATH.INBOX,
      APP_PATH.TOGETHER,
    ]);
    expect(TABS.map((t) => t.labelKey)).toEqual([
      "home",
      "money",
      "plan",
      "inbox",
      "together",
    ]);
    expect(TABS.some((t) => t.href === APP_PATH.HEALTH)).toBe(false);
  });

  it("keeps an Inbox tab that can carry a badge count", () => {
    const inboxTab = TABS.find((t) => t.labelKey === "inbox");
    expect(inboxTab).toBeDefined();
    expect(inboxTab!.href).toBe(APP_PATH.INBOX);
  });

  it("keeps the bar attached as infrastructure, not a floating pill", () => {
    const source = readProjectFile("shared/patterns/bottom-navigation.tsx");
    expect(source).toContain('data-slot="bottom-navigation"');
    expect(source).toContain("bg-primary-soft");
    expect(source).toContain("min-h-14");
    expect(source).toContain("aria-current");
    expect(source).toContain("NAVIGATION_ANIMATION_ID.ACTIVE_PRODUCT_TAB");
    expect(source).toContain("useLinkStatus");
    expect(source).not.toContain("router.push");
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

    // Together sub-routes
    expect(isPathInTab(APP_PATH.TOGETHER, APP_PATH.TOGETHER)).toBe(true);
    expect(isPathInTab(APP_PATH.TOGETHER_MEMBERS, APP_PATH.TOGETHER)).toBe(
      true,
    );
    expect(isPathInTab(APP_PATH.SETTINGS, APP_PATH.TOGETHER)).toBe(true);
    expect(isPathInTab(APP_PATH.PREFERENCES, APP_PATH.TOGETHER)).toBe(true);
    expect(isPathInTab(APP_PATH.POLICIES, APP_PATH.TOGETHER)).toBe(true);
  });

  it("identifies standalone creation and mutation flows to hide bottom nav", async () => {
    const { isStandaloneFlowPath } =
      await import("@/shared/patterns/bottom-navigation");

    expect(isStandaloneFlowPath(APP_PATH.MONEY_ADD)).toBe(true);
    expect(isStandaloneFlowPath(APP_PATH.PLAN_RITUAL)).toBe(true);
    expect(isStandaloneFlowPath(APP_PATH.MONEY_SAVINGS_NEW)).toBe(true);
    expect(isStandaloneFlowPath(APP_PATH.MONEY_INVESTMENTS_NEW)).toBe(true);
    expect(isStandaloneFlowPath(APP_PATH.INVITATIONS_NEW)).toBe(true);
    expect(isStandaloneFlowPath("/money/transactions/tx-1/edit")).toBe(true);
    expect(isStandaloneFlowPath("/money/transactions/tx-1/correct")).toBe(true);
    expect(isStandaloneFlowPath("/money/transactions/tx-1/refund")).toBe(true);

    // Normal paths should not be treated as standalone flows
    expect(isStandaloneFlowPath(APP_PATH.HOME)).toBe(false);
    expect(isStandaloneFlowPath(APP_PATH.MONEY)).toBe(false);
    expect(isStandaloneFlowPath("/money/transactions/tx-1")).toBe(false);
  });
});
