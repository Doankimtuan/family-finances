import type { ReactNode } from "react";
import { isValidElement } from "react";
import { Link } from "@/i18n/navigation";
import {
  JarBudgetState,
  JarState,
  type JarBudgetState as JarBudgetStateValue,
  type JarState as JarStateValue,
} from "@/modules/plan/application/plan-constants";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Progress } from "@/shared/ui/progress";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { ACTION_ICONS, PLAN_ICONS } from "@/shared/ui/icon-registry";
import { FinancialValue } from "./financial-value";

const JAR_INTENTION_ROW_CLASS =
  "flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-2) transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring";
const JAR_COMPACT_ROW_CLASS =
  "flex min-h-11 items-center gap-(--space-3) px-(--space-4) py-(--space-3) transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring";

function financialLeaf(value: ReactNode) {
  return isValidElement(value) ? (
    value
  ) : (
    <FinancialValue>{value}</FinancialValue>
  );
}

function stateTone(state: JarStateValue): StatusBadgeTone {
  return state === JarState.ACTIVE
    ? StatusBadgeTone.POSITIVE
    : StatusBadgeTone.NEUTRAL;
}

export type JarCardProps = {
  name: ReactNode;
  kindLabel: ReactNode;
  stateLabel: ReactNode;
  state: JarStateValue;
  planLabel?: ReactNode;
  remainingLabel?: ReactNode;
  usageLabel?: ReactNode;
  amountLabel?: ReactNode;
  secondaryLabel?: ReactNode;
  compact?: boolean;
  usagePercent?: number;
  budgetState?: JarBudgetStateValue;
  iconTone?: IconContainerTone;
  href?: string;
  className?: string;
  "data-testid"?: string;
};

function JarCardBody({
  name,
  kindLabel,
  stateLabel,
  state,
  planLabel,
  remainingLabel,
  usageLabel,
  amountLabel,
  secondaryLabel,
  usagePercent,
  budgetState,
  compact = false,
  iconTone = IconContainerTone.SAVINGS,
}: Omit<JarCardProps, "href" | "className" | "data-testid">) {
  const value = remainingLabel ?? planLabel;
  const showProgress =
    usagePercent != null && budgetState !== JarBudgetState.NO_BUDGET;
  const overspent = budgetState === JarBudgetState.OVERSPENT;

  return (
    <>
      <div
        className={compact ? JAR_COMPACT_ROW_CLASS : JAR_INTENTION_ROW_CLASS}
      >
        <IconContainer tone={iconTone} size={compact ? "md" : "sm"}>
          <AppIcon icon={PLAN_ICONS.jar} size={AppIconSize.SM} />
        </IconContainer>
        <div className="min-w-0 flex-1">
          {compact ? (
            <>
              <div className="flex min-w-0 items-start justify-between gap-(--space-3)">
                <Text
                  size="sm"
                  weight="semibold"
                  className="min-w-0 text-pretty text-text-primary"
                >
                  {name}
                </Text>
                {amountLabel ? (
                  <Text
                    size="sm"
                    weight="semibold"
                    tone={overspent ? "danger" : "primary"}
                    tabular
                    className="shrink-0 whitespace-nowrap tracking-tight"
                    data-financial-kind={FinancialNumberKind.INTENTION}
                  >
                    {amountLabel}
                  </Text>
                ) : null}
              </div>
              <div className="mt-(--space-1) flex flex-wrap items-center gap-x-(--space-2) gap-y-(--space-1)">
                <StatusBadge tone={StatusBadgeTone.NEUTRAL}>
                  {kindLabel}
                </StatusBadge>
                {secondaryLabel ? (
                  <Text size="xs" tone={overspent ? "danger" : "secondary"}>
                    {secondaryLabel}
                  </Text>
                ) : null}
              </div>
              {usageLabel ? (
                <Text
                  size="xs"
                  tone="secondary"
                  className="mt-(--space-2) text-pretty"
                >
                  <FinancialValue>{usageLabel}</FinancialValue>
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <Text
                size="sm"
                weight="semibold"
                className="truncate text-text-primary"
              >
                {name}
              </Text>
              <Text
                size="xs"
                tone="muted"
                className="mt-(--space-1) truncate text-pretty"
              >
                {kindLabel}
              </Text>
            </>
          )}
        </div>
        {!compact ? (
          <div className="flex shrink-0 items-center gap-(--space-2)">
            <div className="min-w-[var(--financial-number-column-width)] text-right">
              {value ? (
                <Text
                  size="sm"
                  weight="semibold"
                  tone={overspent ? "danger" : "primary"}
                  tabular
                  className="tracking-tight"
                  data-financial-kind={FinancialNumberKind.INTENTION}
                >
                  {financialLeaf(value)}
                </Text>
              ) : null}
              <div className="mt-(--space-1) flex justify-end">
                <StatusBadge tone={stateTone(state)}>{stateLabel}</StatusBadge>
              </div>
            </div>
            <AppIcon
              icon={ACTION_ICONS.forward}
              size={AppIconSize.SM}
              className="shrink-0 text-text-tertiary"
            />
          </div>
        ) : null}
      </div>
      {showProgress ? (
        <div className="px-(--space-4) pb-(--space-3)">
          <Progress
            value={usagePercent}
            max={100}
            label={usageLabel != null ? String(usageLabel) : undefined}
            showLabel={!compact}
            privacyAware
            trackClassName={compact ? "h-(--space-1)" : undefined}
            indicatorClassName={overspent ? "bg-danger" : undefined}
          />
        </div>
      ) : null}
    </>
  );
}

/** Intention Jar row — remaining/planned are envelopes, never a bank Balance. */
export function JarCard({
  href,
  className,
  "data-testid": testId,
  ...body
}: JarCardProps) {
  const shared = {
    className: cn("flex flex-col", className),
    title: typeof body.name === "string" ? body.name : undefined,
    "data-testid": testId,
    "data-jar-state": body.state,
    "data-budget-state": body.budgetState,
    "data-financial-object": "jar",
  } as const;

  if (href) {
    return (
      <Link href={href} prefetch={PRODUCT_LINK_PREFETCH} {...shared}>
        <JarCardBody {...body} />
      </Link>
    );
  }

  return (
    <div {...shared}>
      <JarCardBody {...body} />
    </div>
  );
}
