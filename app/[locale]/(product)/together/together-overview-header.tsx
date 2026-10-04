import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { TOGETHER_PATH } from "@/modules/tenancy/application/tenancy-constants";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { AppIcon } from "@/shared/ui/app-icon";
import { Heading } from "@/shared/ui/heading";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { ACTION_ICONS, NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";

export function TogetherOverviewHeader({
  eyebrow,
  title,
  supporting,
  roleLabel,
  settingsLabel,
}: {
  eyebrow: string;
  title: ReactNode;
  supporting: string;
  roleLabel: ReactNode;
  settingsLabel: string;
}) {
  return (
    <TopAppBar
      variant={TopAppBarVariant.DETAIL}
      className="pt-(--space-4)"
      eyebrow={eyebrow}
      eyebrowClassName="text-xs font-semibold uppercase tracking-wide"
      title={
        <div className="flex items-center gap-(--space-2)">
          <IconContainer tone={IconContainerTone.PRIMARY} size="sm">
            <AppIcon icon={NAVIGATION_ICONS.together} size="sm" />
          </IconContainer>
          <Heading
            level={1}
            className="min-w-0 flex-1 text-xl font-semibold leading-tight tracking-tight"
          >
            {title}
          </Heading>
          <StatusBadge tone={StatusBadgeTone.INFO} className="shrink-0">
            {roleLabel}
          </StatusBadge>
          <Link
            href={TOGETHER_PATH.SETTINGS}
            aria-label={settingsLabel}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-(--radius-control) text-text-secondary hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <AppIcon icon={ACTION_ICONS.more} size="sm" />
          </Link>
        </div>
      }
      subtitle={<p className="text-xs leading-relaxed">{supporting}</p>}
    />
  );
}
