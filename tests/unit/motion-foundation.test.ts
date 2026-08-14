import { describe, expect, it } from "vitest";
import {
  MotionStepDirection,
  motionTokens,
  shouldAnimate,
  springs,
  stepVariants,
} from "@/shared/motion";

describe("motion foundation", () => {
  it("exposes one semantic token and spring contract", () => {
    expect(motionTokens.duration).toEqual({
      instant: 0.08,
      fast: 0.15,
      normal: 0.2,
      slow: 0.25,
      deliberate: 0.6,
    });
    expect(springs).toHaveProperty("snappy");
    expect(springs).toHaveProperty("gentle");
    expect(springs).toHaveProperty("bouncy");
    expect(springs).toHaveProperty("instant");
    expect(springs).toHaveProperty("release");
  });

  it("gates reduced and non-essential low-end motion", () => {
    expect(shouldAnimate({ reducedMotion: false, lowEnd: false })).toBe(true);
    expect(shouldAnimate({ reducedMotion: true, lowEnd: false })).toBe(false);
    expect(shouldAnimate({ reducedMotion: false, lowEnd: true })).toBe(false);
    expect(
      shouldAnimate({ essential: true, reducedMotion: false, lowEnd: true }),
    ).toBe(true);
  });

  it("keeps step direction in the transform axis", () => {
    const forward = stepVariants(MotionStepDirection.FORWARD, false);
    const backward = stepVariants(MotionStepDirection.BACKWARD, false);

    expect(forward.initial.x).toBeGreaterThan(0);
    expect(backward.initial.x).toBeLessThan(0);
    expect(forward.exit.x).toBeLessThan(0);
    expect(backward.exit.x).toBeGreaterThan(0);
  });

  it("removes transform movement for reduced motion", () => {
    const variants = stepVariants(MotionStepDirection.FORWARD, true);

    expect(variants.initial.x).toBe(0);
    expect(variants.exit.x).toBe(0);
    expect(variants.animate.x).toBe(0);
  });
});
