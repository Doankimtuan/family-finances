import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TABS } from "@/shared/patterns/bottom-navigation-tabs";

describe("BottomNavigation foundation", () => {
  it("exposes exactly five IA tabs and excludes Health", () => {
    expect(TABS).toHaveLength(5);
    expect(TABS.map((t) => t.href)).toEqual([
      "/home",
      "/money",
      "/plan",
      "/inbox",
      "/together",
    ]);
    expect(TABS.map((t) => t.labelKey)).toEqual([
      "home",
      "money",
      "plan",
      "inbox",
      "together",
    ]);
    expect(TABS.some((t) => t.href === "/health")).toBe(false);
  });

  it("keeps an Inbox badge placeholder slot in the pattern", () => {
    const source = readFileSync(
      join(process.cwd(), "shared/patterns/bottom-navigation.tsx"),
      "utf8",
    );
    expect(source).toContain("inbox-badge-placeholder");
    expect(source).toContain('labelKey === "inbox"');
  });
});
