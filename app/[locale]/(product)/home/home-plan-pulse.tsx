import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Card } from "@/shared/patterns/card";
import { Section } from "@/shared/patterns/section";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { ACTION_ICONS, FINANCE_ICONS } from "@/shared/ui/icon-registry";

/**
 * Intention preview: active jars and income-allocation mode. Never presented
 * as accessible cash.
 */
export function HomePlanPulse({
  title,
  hint,
  jarsCount,
  allocateLabel,
  openLabel,
}: {
  title: string;
  hint: string;
  jarsCount: string;
  allocateLabel: string;
  openLabel: string;
}) {
  return (
    <Section title={title} description={hint} testId={HOME_TEST_ID.PLAN_PULSE}>
      <Card tone="elevated" className="gap-0 p-0">
        <Link
          href={APP_PATH.PLAN}
          prefetch={PRODUCT_LINK_PREFETCH}
          aria-label={openLabel}
          className="flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-3) transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
          data-testid={HOME_TEST_ID.PLAN_LINK}
        >
          <IconContainer tone={IconContainerTone.SAVINGS} size="md">
            <AppIcon icon={FINANCE_ICONS.savings} size="md" />
          </IconContainer>
          <div className="min-w-0 flex-1">
            <Text size="sm" className="font-semibold text-text-primary">
              {jarsCount}
            </Text>
            <Text size="sm" tone="secondary" className="text-pretty">
              {allocateLabel}
            </Text>
          </div>
          <AppIcon
            icon={ACTION_ICONS.forward}
            size="sm"
            className="shrink-0 text-text-tertiary"
          />
        </Link>
      </Card>
    </Section>
  );
}
