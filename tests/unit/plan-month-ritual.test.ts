import { describe, expect, it } from "vitest";
import {
  currentPeriodMonth,
  formatPeriodLabel,
} from "@/modules/plan/application/ritual-period";
import {
  mapRitualMode,
  mapRitualStatus,
} from "@/modules/plan/application/ritual-types";
import { correctMonthRitualInputSchema } from "@/modules/plan/application/commands/month-ritual";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";

describe("ritual period helpers", () => {
  it("formats UTC month start as YYYY-MM-01", () => {
    expect(currentPeriodMonth(new Date("2026-08-15T12:00:00Z"))).toBe(
      "2026-08-01",
    );
    expect(formatPeriodLabel("2026-08-01")).toBe("2026-08");
  });
});

describe("ritual status / mode mapping", () => {
  it("defaults to draft and assisted", () => {
    expect(mapRitualStatus(undefined)).toBe("draft");
    expect(mapRitualStatus("approved")).toBe("approved");
    expect(mapRitualMode(undefined)).toBe("assisted");
    expect(mapRitualMode("manual")).toBe("manual");
  });
});

describe("correctMonthRitualInputSchema", () => {
  it("requires a short note", () => {
    expect(
      correctMonthRitualInputSchema.safeParse({ note: "ab" }).success,
    ).toBe(false);
    expect(
      correctMonthRitualInputSchema.safeParse({
        note: "Rollover mis-click",
      }).success,
    ).toBe(true);
  });
});

describe("month lock error code", () => {
  it("exposes month_locked for plan mutations", () => {
    expect(PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED).toBe("month_locked");
  });
});
