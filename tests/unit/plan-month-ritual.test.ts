import { describe, expect, it } from "vitest";
import {
  currentPeriodMonth,
  formatPeriodLabel,
  isRitualAutolockDue,
  isQuickCloseEligible,
  periodMonthEndDate,
} from "@/modules/plan/application/ritual-period";
import {
  isRitualLockedStatus,
  mapRitualMode,
  mapRitualStatus,
  resolveQuickCloseEligible,
} from "@/modules/plan/application/ritual-types";
import { correctMonthRitualInputSchema } from "@/modules/plan/application/commands/month-ritual";
import {
  MISCELLANEOUS_JAR_NAME,
  QUICK_CLOSE_CONSECUTIVE_RITUALS,
  RITUAL_AUTOLOCK_DAYS_AFTER_MONTH_END,
  RITUAL_GATE_ERROR_CODE,
  RitualStatus,
} from "@/modules/plan/application/plan-constants";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";

describe("ritual period helpers", () => {
  it("formats UTC month start as YYYY-MM-01", () => {
    expect(currentPeriodMonth(new Date("2026-08-15T12:00:00Z"))).toBe(
      "2026-08-01",
    );
    expect(formatPeriodLabel("2026-08-01")).toBe("2026-08");
    expect(periodMonthEndDate("2026-01-01")).toBe("2026-01-31");
  });

  it("AC-RIT-01: January is due for auto-lock on March 2", () => {
    expect(
      isRitualAutolockDue(
        "2026-01-01",
        RITUAL_AUTOLOCK_DAYS_AFTER_MONTH_END,
        new Date("2026-03-02T00:00:00Z"),
      ),
    ).toBe(true);
    expect(
      isRitualAutolockDue(
        "2026-01-01",
        RITUAL_AUTOLOCK_DAYS_AFTER_MONTH_END,
        new Date("2026-03-01T00:00:00Z"),
      ),
    ).toBe(false);
  });
});

describe("ritual status / mode mapping", () => {
  it("defaults to draft and assisted", () => {
    expect(mapRitualStatus(undefined)).toBe("draft");
    expect(mapRitualStatus("approved")).toBe("approved");
    expect(mapRitualStatus("pending_review")).toBe("pending_review");
    expect(mapRitualMode(undefined)).toBe("assisted");
    expect(mapRitualMode("manual")).toBe("manual");
    expect(mapRitualMode("quick_close")).toBe("quick_close");
  });

  it("treats approved and pending_review as locked", () => {
    expect(isRitualLockedStatus(RitualStatus.APPROVED)).toBe(true);
    expect(isRitualLockedStatus(RitualStatus.PENDING_REVIEW)).toBe(true);
    expect(isRitualLockedStatus(RitualStatus.PREVIEWED)).toBe(false);
  });
});

describe("Quick Close eligibility (BR-23)", () => {
  it("unlocks at six consecutive Assisted completions", () => {
    expect(QUICK_CLOSE_CONSECUTIVE_RITUALS).toBe(6);
    expect(isQuickCloseEligible(5, QUICK_CLOSE_CONSECUTIVE_RITUALS)).toBe(
      false,
    );
    expect(isQuickCloseEligible(6, QUICK_CLOSE_CONSECUTIVE_RITUALS)).toBe(true);
    expect(resolveQuickCloseEligible(6)).toBe(true);
  });

  it("maps Miscellaneous fallback jar to seeded General name", () => {
    expect(MISCELLANEOUS_JAR_NAME).toBe("General");
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

describe("month lock error codes", () => {
  it("exposes month_locked and ritual gate codes", () => {
    expect(PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED).toBe("month_locked");
    expect(RITUAL_GATE_ERROR_CODE.RITUAL_DIVERGENCE).toBe("ritual_divergence");
    expect(RITUAL_GATE_ERROR_CODE.QUICK_CLOSE_LOCKED).toBe(
      "quick_close_locked",
    );
  });
});
