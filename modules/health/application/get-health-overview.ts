import { getHealthDetail, type HealthDetail } from "./get-health-detail";

export type HealthOverview = Pick<
  HealthDetail,
  | "health"
  | "accountCount"
  | "activeJarCount"
  | "openInboxCount"
  | "hasEmiCompletePending"
>;

/**
 * Health overview pulse for Home chip + /health (AC-015).
 */
export async function getHealthOverview(): Promise<HealthOverview | null> {
  const detail = await getHealthDetail();
  if (detail == null) {
    return null;
  }
  return {
    health: detail.health,
    accountCount: detail.accountCount,
    activeJarCount: detail.activeJarCount,
    openInboxCount: detail.openInboxCount,
    hasEmiCompletePending: detail.hasEmiCompletePending,
  };
}
