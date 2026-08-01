import path from "node:path";
import type { GateProfile, SideEffect } from "../schemas/common";

export type AiosCoreConfig = {
  /** Absolute path to ai-os root (schemas JSON, registry, policies, templates). */
  aiosRoot: string;
  /** Absolute path for runtime artifact mounts. */
  runtimeRoot: string;
  /** Default gate profile for new orchestrations. */
  defaultGateProfile: GateProfile;
  /** Default orchestration budget. */
  budget: {
    maxWaves: number;
    maxRetriesPerTask: number;
    allowedSideEffects: SideEffect[];
  };
  /** When true, refuse plans that reference reserved skills without acceptReservedSkills. */
  requireActiveSkills: boolean;
};

export function resolveAiosRoot(fromCwd = process.cwd()): string {
  return path.resolve(fromCwd, "ai-os");
}

export function createDefaultConfig(
  overrides: Omit<Partial<AiosCoreConfig>, "budget"> & {
    budget?: Partial<AiosCoreConfig["budget"]>;
  } = {},
): AiosCoreConfig {
  const aiosRoot = overrides.aiosRoot ?? resolveAiosRoot();
  return {
    aiosRoot,
    runtimeRoot: overrides.runtimeRoot ?? path.join(aiosRoot, "runtime"),
    defaultGateProfile: overrides.defaultGateProfile ?? "standard",
    budget: {
      maxWaves: overrides.budget?.maxWaves ?? 32,
      maxRetriesPerTask: overrides.budget?.maxRetriesPerTask ?? 2,
      allowedSideEffects: overrides.budget?.allowedSideEffects ?? [
        "none",
        "runtime-write",
      ],
    },
    requireActiveSkills: overrides.requireActiveSkills ?? true,
  };
}
