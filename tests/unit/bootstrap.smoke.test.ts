import { describe, expect, it } from "vitest";
import { cn } from "@/shared/utils/cn";

describe("bootstrap smoke", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toContain("a");
  });
});
