import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";

const HEALTH_INSIGHTS_LINK_CLASSNAME =
  "inline-flex min-h-11 w-full items-center justify-center rounded-(--radius-control) bg-accent px-(--space-4) text-sm font-semibold text-accent-fg shadow-(--elevation-1) transition-[background-color,transform,box-shadow] duration-(--duration-fast) hover:-translate-y-px hover:shadow-(--elevation-2) active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

export function HealthViewInsightsAction({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Link
      href={APP_PATH.HEALTH_INSIGHTS}
      prefetch={PRODUCT_LINK_PREFETCH}
      className={HEALTH_INSIGHTS_LINK_CLASSNAME}
      data-testid="health-view-insights"
    >
      {children}
    </Link>
  );
}
