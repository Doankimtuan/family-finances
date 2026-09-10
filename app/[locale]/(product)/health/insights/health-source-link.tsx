import { Link } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import type { HealthSourceKind as HealthSourceKindValue } from "@/modules/health/application/health-constants";
import { healthSourceHref } from "../health-presentations";

export function HealthSourceLink({
  source,
  label,
  factor,
  origin = APP_PATH.HEALTH_INSIGHTS,
  testId,
}: {
  source: HealthSourceKindValue;
  label: string;
  factor: string;
  origin?: string;
  testId: string;
}) {
  return (
    <Link
      href={healthSourceHref(source, origin, factor)}
      prefetch={PRODUCT_LINK_PREFETCH}
      className="inline-flex min-h-11 items-center text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      data-testid={testId}
    >
      {label}
    </Link>
  );
}
