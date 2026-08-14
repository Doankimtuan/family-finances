"use client";

import { useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";
import { isLowEndDevice } from "./config";

export function useMotionPolicy({ essential = false } = {}) {
  const reducedMotion = useReducedMotion() === true;
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const lowEnd = mounted && isLowEndDevice();
  const enabled = mounted && !reducedMotion && (essential || !lowEnd);

  return {
    mounted,
    reducedMotion,
    lowEnd,
    enabled,
  };
}
