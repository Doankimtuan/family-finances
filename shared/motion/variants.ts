import {
  MotionStepDirection,
  motionTokens,
  type MotionStepDirection as MotionStepDirectionValue,
} from "./tokens";

export const revealVariants = {
  hidden: { opacity: 0, y: motionTokens.distance.sm },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -motionTokens.distance.sm },
} as const;

export const reducedRevealVariants = {
  hidden: { opacity: 0, y: 0 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 0 },
} as const;

export function stepVariants(
  direction: MotionStepDirectionValue,
  reducedMotion: boolean,
) {
  const distance =
    direction === MotionStepDirection.FORWARD
      ? motionTokens.distance.sm
      : -motionTokens.distance.sm;
  const safeDistance = reducedMotion ? 0 : distance;

  return {
    initial: { opacity: reducedMotion ? 1 : 0, x: safeDistance },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: reducedMotion ? 0 : -safeDistance },
  } as const;
}
