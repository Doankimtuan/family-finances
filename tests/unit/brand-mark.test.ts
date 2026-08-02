import { describe, expect, it } from "vitest";
import { BRAND_MARK_PATH } from "@/shared/patterns/brand-mark";

describe("Cradle & Seed brand mark", () => {
  it("exports the locked geometry path from branding SoT", () => {
    expect(BRAND_MARK_PATH).toContain("A10,10");
    expect(BRAND_MARK_PATH).toContain("A4,4");
    expect(BRAND_MARK_PATH.split("M").length - 1).toBe(2);
  });
});
