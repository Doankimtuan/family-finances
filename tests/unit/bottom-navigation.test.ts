import { describe, expect, it } from "vitest";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { TABS } from "@/shared/patterns/bottom-navigation-tabs";

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
