/**
 * Planned downtime flag for system.maintenance (ST-E08-001).
 * Set NEXT_PUBLIC_MAINTENANCE_MODE=true (or MAINTENANCE_MODE) to engage the shell.
 */

export function isMaintenanceMode(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const raw = (env.NEXT_PUBLIC_MAINTENANCE_MODE ?? env.MAINTENANCE_MODE ?? "")
    .trim()
    .toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

/** Locale-relative paths that remain reachable during maintenance. */
export const MAINTENANCE_ALLOWED_SEGMENTS = [
  "maintenance",
  "login",
  "register",
  "forgot-password",
  "splash",
  "welcome",
  "auth",
] as const;

/**
 * True when a locale-prefixed pathname should redirect to /maintenance.
 * Examples: `/en/home` → true; `/en/maintenance` → false; `/auth/confirm` → false.
 */
export function shouldRedirectToMaintenance(
  pathname: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!isMaintenanceMode(env)) {
    return false;
  }

  if (pathname.startsWith("/auth/")) {
    return false;
  }

  const parts = pathname.split("/").filter(Boolean);
  // Expect `/{locale}/...` after i18n middleware; bare paths are left alone.
  if (parts.length < 2) {
    return false;
  }

  const segment = parts[1] ?? "";
  return !(MAINTENANCE_ALLOWED_SEGMENTS as readonly string[]).includes(segment);
}
