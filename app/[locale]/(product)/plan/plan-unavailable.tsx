import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/shared/patterns/empty-state";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { PLAN_ICONS } from "@/shared/ui/icon-registry";
import { PLAN_SURFACE_LINK_CLASS } from "./plan-chrome";

type PlanUnavailableProps = {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  icon?: ReactNode;
  testId?: string;
};

/** Composed recovery for a missing Plan resource. Copy stays with the caller. */
export function PlanUnavailable({
  title,
  description,
  actionHref,
  actionLabel,
  icon,
  testId,
}: PlanUnavailableProps) {
  return (
    <div className="flex flex-1 flex-col items-center" data-testid={testId}>
      <EmptyState
        title={title}
        description={description}
        icon={
          icon ?? <AppIcon icon={PLAN_ICONS.jar} size={AppIconSize.DISPLAY} />
        }
        className="flex-none"
        action={
          <Link href={actionHref} className={PLAN_SURFACE_LINK_CLASS}>
            {actionLabel}
          </Link>
        }
      />
    </div>
  );
}
