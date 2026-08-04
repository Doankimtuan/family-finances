/**
 * BR-12 — household categories must bind N:1 to an active jar.
 * System template categories may omit jar_id (household copies bind on create).
 */

export function requiresJarMapping(input: {
  isSystem: boolean;
  jarId: string | null | undefined;
}): boolean {
  return !input.isSystem;
}

export function isCategoryJarMapped(input: {
  isSystem: boolean;
  jarId: string | null | undefined;
}): boolean {
  if (input.isSystem) return true;
  return typeof input.jarId === "string" && input.jarId.length > 0;
}
