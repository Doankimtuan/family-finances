export type MotionPolicyOptions = {
  essential?: boolean;
  reducedMotion?: boolean;
  lowEnd?: boolean;
};

export function isLowEndDevice() {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency > 0 &&
    navigator.hardwareConcurrency <= 4
  );
}

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function shouldAnimate({
  essential = false,
  reducedMotion = prefersReducedMotion(),
  lowEnd = isLowEndDevice(),
}: MotionPolicyOptions = {}) {
  if (reducedMotion) return false;
  if (!essential && lowEnd) return false;
  return true;
}
