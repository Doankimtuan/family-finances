import type { IconSvgElement } from "@hugeicons/react";
import type { HealthSourceKind as HealthSourceKindValue } from "@/modules/health/application/health-constants";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { Text } from "@/shared/ui/text";
import { HealthSourceLink } from "./insights/health-source-link";

type HealthFactRowProps = {
  icon: IconSvgElement;
  label: string;
  source: HealthSourceKindValue;
  sourceLabel: string;
  factor: string;
  origin: string;
  testId: string;
};

export function HealthFactRow({
  icon,
  label,
  source,
  sourceLabel,
  factor,
  origin,
  testId,
}: HealthFactRowProps) {
  return (
    <li className="flex min-h-14 items-start gap-(--space-3) px-(--space-4) py-(--space-3)">
      <IconContainer tone={IconContainerTone.NEUTRAL} size="sm">
        <AppIcon icon={icon} size={AppIconSize.SM} decorative />
      </IconContainer>
      <div className="min-w-0 flex-1">
        <Text
          size="sm"
          weight="medium"
          className="text-pretty text-text-primary"
        >
          {label}
        </Text>
        <HealthSourceLink
          source={source}
          label={sourceLabel}
          factor={factor}
          origin={origin}
          testId={testId}
        />
      </div>
    </li>
  );
}
