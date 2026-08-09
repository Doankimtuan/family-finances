import { Link } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  HEALTH_SOURCE_QUERY,
  HealthSourceKind,
  type HealthSourceKind as HealthSourceKindValue,
} from "@/modules/health/application/health-constants";

const HEALTH_SOURCE_PATH: Record<HealthSourceKindValue, string> = {
  [HealthSourceKind.ACCOUNTS]: APP_PATH.MONEY_ACCOUNTS,
  [HealthSourceKind.TRANSACTIONS]: APP_PATH.MONEY_TRANSACTIONS,
  [HealthSourceKind.PLAN_JARS]: APP_PATH.PLAN_JARS,
  [HealthSourceKind.INBOX]: APP_PATH.INBOX,
};

export function HealthSourceLink({
  source,
  label,
  factor,
  testId,
}: {
  source: HealthSourceKindValue;
  label: string;
  factor: string;
  testId: string;
}) {
  const query = new URLSearchParams({
    [HEALTH_SOURCE_QUERY.ORIGIN]: APP_PATH.HEALTH_INSIGHTS,
    [HEALTH_SOURCE_QUERY.FACTOR]: factor,
  });

  return (
    <Link
      href={`${HEALTH_SOURCE_PATH[source]}?${query.toString()}`}
      className="inline-flex min-h-11 items-center text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      data-testid={testId}
    >
      {label}
    </Link>
  );
}
