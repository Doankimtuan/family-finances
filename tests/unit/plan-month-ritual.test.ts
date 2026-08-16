import { describe, expect, it } from "vitest";
import { assertPlanPeriodUnlocked } from "@/modules/plan/application/assert-plan-unlocked";
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
  RitualMode,
  RitualStatus,
} from "@/modules/plan/application/plan-constants";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import {
  ReviewItemType,
  toReviewItemType,
  InboxItemKind,
} from "@/modules/inbox/application/inbox-constants";

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
    expect(mapRitualStatus(undefined)).toBe(RitualStatus.DRAFT);
    expect(mapRitualStatus(RitualStatus.APPROVED)).toBe(RitualStatus.APPROVED);
    expect(mapRitualStatus(RitualStatus.PENDING_REVIEW)).toBe(
      RitualStatus.PENDING_REVIEW,
    );
    expect(mapRitualMode(undefined)).toBe(RitualMode.ASSISTED);
    expect(mapRitualMode(RitualMode.MANUAL)).toBe(RitualMode.MANUAL);
    expect(mapRitualMode(RitualMode.QUICK_CLOSE)).toBe(RitualMode.QUICK_CLOSE);
  });

  it("Plan V2: approved and pending_review never lock mutations", () => {
    expect(isRitualLockedStatus(RitualStatus.APPROVED)).toBe(false);
    expect(isRitualLockedStatus(RitualStatus.PENDING_REVIEW)).toBe(false);
    expect(isRitualLockedStatus(RitualStatus.PREVIEWED)).toBe(false);
  });
});

describe("Quick Close eligibility (BR-23 deprecated)", () => {
  it("retains threshold constant for historical helpers only", () => {
    expect(QUICK_CLOSE_CONSECUTIVE_RITUALS).toBe(6);
    expect(isQuickCloseEligible(5, QUICK_CLOSE_CONSECUTIVE_RITUALS)).toBe(
      false,
    );
    expect(isQuickCloseEligible(6, QUICK_CLOSE_CONSECUTIVE_RITUALS)).toBe(true);
    expect(resolveQuickCloseEligible(6)).toBe(false);
  });

  it("maps Miscellaneous fallback jar to seeded General name", () => {
    expect(MISCELLANEOUS_JAR_NAME).toBe("General");
  });
});

describe("Plan V2 review mutability", () => {
  it.each([
    ["approved review", "approved"],
    ["pending review", "pending_review"],
    ["no review", null],
  ])("allows Plan mutations after %s", async (_label, _status) => {
    void _label;
    void _status;
    await expect(assertPlanPeriodUnlocked("household-id", "2026-08-01")).resolves.toEqual({
      ok: true,
    });
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
    expect(RITUAL_GATE_ERROR_CODE.EMERGENCIES_UNACKNOWLEDGED).toBe(
      "emergencies_unacknowledged",
    );
  });
});

describe("BR-11 InstallmentComplete mapping", () => {
  it("maps emi_complete inbox kind to InstallmentComplete ReviewItem", () => {
    expect(toReviewItemType(InboxItemKind.EMI_COMPLETE)).toBe(
      ReviewItemType.INSTALLMENT_COMPLETE,
    );
  });
});
