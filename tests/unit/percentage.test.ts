import { describe, expect, it } from "vitest";
import {
  basisPointsToPercentage,
  percentageToBasisPoints,
} from "@/shared/utils/percentage";

describe("percentage and basis-point conversions", () => {
  it("converts percentage points to whole basis points with Math.round semantics", () => {
    expect(percentageToBasisPoints(0)).toBe(0);
    expect(percentageToBasisPoints(1)).toBe(100);
    expect(percentageToBasisPoints(1.004)).toBe(100);
    expect(percentageToBasisPoints(1.006)).toBe(101);
    expect(percentageToBasisPoints(100)).toBe(10_000);
  });

  it("normalizes invalid or negative user-entered percentages", () => {
    expect(percentageToBasisPoints(-1)).toBe(0);
    expect(percentageToBasisPoints(Number.NaN)).toBe(0);
    expect(percentageToBasisPoints(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("converts basis points to exact percentage points", () => {
    expect(basisPointsToPercentage(0)).toBe(0);
    expect(basisPointsToPercentage(-25)).toBe(-0.25);
    expect(basisPointsToPercentage(125)).toBe(1.25);
    expect(basisPointsToPercentage(10_000)).toBe(100);
    expect(basisPointsToPercentage(Number.NaN)).toBe(0);
  });
});
