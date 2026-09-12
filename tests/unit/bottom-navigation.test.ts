import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { TABS } from "@/shared/patterns/bottom-navigation-tabs";

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
});
