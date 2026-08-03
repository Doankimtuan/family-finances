import { describe, expect, it } from "vitest";
import {
  isMaintenanceMode,
  shouldRedirectToMaintenance,
} from "@/modules/platform/application/maintenance-mode";

describe("maintenance mode", () => {
  it("detects common truthy flags", () => {
    expect(isMaintenanceMode({ NEXT_PUBLIC_MAINTENANCE_MODE: "true" })).toBe(
      true,
    );
    expect(isMaintenanceMode({ MAINTENANCE_MODE: "1" })).toBe(true);
    expect(isMaintenanceMode({ MAINTENANCE_MODE: "on" })).toBe(true);
    expect(isMaintenanceMode({ NEXT_PUBLIC_MAINTENANCE_MODE: "false" })).toBe(
      false,
    );
    expect(isMaintenanceMode({})).toBe(false);
  });

  it("redirects product paths but allows maintenance and auth shells", () => {
    const on = { NEXT_PUBLIC_MAINTENANCE_MODE: "true" };
    expect(shouldRedirectToMaintenance("/en/home", on)).toBe(true);
    expect(shouldRedirectToMaintenance("/en/money", on)).toBe(true);
    expect(shouldRedirectToMaintenance("/en/maintenance", on)).toBe(false);
    expect(shouldRedirectToMaintenance("/en/login", on)).toBe(false);
    expect(shouldRedirectToMaintenance("/auth/confirm", on)).toBe(false);
    expect(shouldRedirectToMaintenance("/en/home", {})).toBe(false);
  });
});
