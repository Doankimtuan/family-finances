import { describe, expect, it } from "vitest";
import { TABS } from "@/shared/patterns/bottom-navigation";

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
    expect(TABS.some((t) => t.href === "/health")).toBe(false);
  });
});
