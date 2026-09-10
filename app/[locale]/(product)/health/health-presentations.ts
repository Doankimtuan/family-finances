import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  HEALTH_SOURCE_QUERY,
  HealthSourceKind,
  type HealthSourceKind as HealthSourceKindValue,
} from "@/modules/health/application/health-constants";
import {
  FINANCE_ICONS,
  NAVIGATION_ICONS,
  PLAN_ICONS,
} from "@/shared/ui/icon-registry";

export const HEALTH_SOURCE_PATH: Record<HealthSourceKindValue, string> = {
  [HealthSourceKind.ACCOUNTS]: APP_PATH.MONEY_ACCOUNTS,
  [HealthSourceKind.TRANSACTIONS]: APP_PATH.MONEY_TRANSACTIONS,
  [HealthSourceKind.PLAN_JARS]: APP_PATH.PLAN_JARS,
  [HealthSourceKind.INBOX]: APP_PATH.INBOX,
};

export const HEALTH_FACT_ICON = {
  [HealthSourceKind.ACCOUNTS]: FINANCE_ICONS.account,
  [HealthSourceKind.TRANSACTIONS]: FINANCE_ICONS.transfer,
  [HealthSourceKind.PLAN_JARS]: PLAN_ICONS.jar,
  [HealthSourceKind.INBOX]: NAVIGATION_ICONS.inbox,
} as const;

export function healthSourceHref(
  source: HealthSourceKindValue,
  origin: string,
  factor: string,
): string {
  const query = new URLSearchParams({
    [HEALTH_SOURCE_QUERY.ORIGIN]: origin,
    [HEALTH_SOURCE_QUERY.FACTOR]: factor,
  });
  return `${HEALTH_SOURCE_PATH[source]}?${query.toString()}`;
}
