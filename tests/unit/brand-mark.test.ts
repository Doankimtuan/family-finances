import { describe, expect, it } from "vitest";
import { BRAND_ASSET_PATHS, BRAND_NAME } from "@/shared/constants/brand";

describe("Family Finance brand mark", () => {
  it("keeps the approved source and derived UI assets addressable", () => {
    expect(BRAND_NAME).toBe("Family Finance");
    expect(BRAND_ASSET_PATHS.SOURCE).toBe("/brand/logo-primary.png");
    expect(BRAND_ASSET_PATHS.LOCKUP).toBe("/brand/logo-lockup.png");
    expect(BRAND_ASSET_PATHS.TRANSPARENT_MARK).toBe(
      "/brand/logo-mark-transparent.png",
    );
    expect(BRAND_ASSET_PATHS.APP_ICON).toBe("/brand/app-icon.png");
  });
});
