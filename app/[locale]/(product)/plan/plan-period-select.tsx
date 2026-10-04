"use client";

import { useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import {
  APP_PATH,
  PLAN_MONTH_QUERY,
} from "@/modules/tenancy/application/app-path";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { Select } from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";
import {
  ACTION_ICONS,
  PLAN_ICONS,
  UTILITY_ICONS,
} from "@/shared/ui/icon-registry";

export type PlanPeriodOption = {
  value: string;
  label: string;
  shortLabel: string;
};

export function PlanPeriodSelect({
  label,
  loadingLabel,
  options,
  selectedMonth,
  historical,
  previousLabel,
  nextLabel,
}: {
  label: string;
  loadingLabel: string;
  options: readonly PlanPeriodOption[];
  selectedMonth: string;
  historical: boolean;
  previousLabel: string;
  nextLabel: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const ordered = [...options].sort((a, b) => a.value.localeCompare(b.value));
  const index = ordered.findIndex((option) => option.value === selectedMonth);
  const previous = ordered[index - 1];
  const next = ordered[index + 1];

  function selectMonth(month: string) {
    if (month === selectedMonth || isPending) return;
    startTransition(() =>
      router.replace({
        pathname: APP_PATH.PLAN,
        query: { [PLAN_MONTH_QUERY]: month },
      }),
    );
  }

  return (
    <div
      className="flex w-full items-center gap-(--space-1) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-1)"
      data-testid="plan-month-navigation"
    >
      <Button
        variant={ButtonVariant.GHOST}
        className="min-w-0 flex-1 gap-(--space-1) px-(--space-1) text-xs"
        aria-label={
          previous ? `${previousLabel}: ${previous.label}` : previousLabel
        }
        isDisabled={!previous || isPending}
        onPress={() => previous && selectMonth(previous.value)}
        data-testid="plan-month-previous"
      >
        <AppIcon icon={ACTION_ICONS.back} size={AppIconSize.XS} />
        <span className="text-pretty">
          {previous?.shortLabel ?? previousLabel}
        </span>
      </Button>
      <Select
        aria-label={label}
        aria-busy={isPending || undefined}
        className="min-w-0 flex-[2]"
        selectedKey={selectedMonth}
        isDisabled={isPending || options.length < 2}
        onSelectionChange={(key) => key != null && selectMonth(String(key))}
        data-testid="plan-period-selector"
      >
        <Select.Trigger
          className="gap-(--space-1) border-primary/30 bg-primary-soft px-(--space-2) text-xs font-semibold text-primary"
          leadingIcon={
            <AppIcon
              icon={
                historical ? PLAN_ICONS.lockedPeriod : UTILITY_ICONS.calendar
              }
              size={AppIconSize.XS}
              className="text-primary"
            />
          }
        >
          <Select.Value className="whitespace-normal text-center text-xs leading-snug text-primary" />
          {isPending ? (
            <Spinner
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
          ) : null}
        </Select.Trigger>
        <Select.Popover className="min-w-max">
          <Select.ListBox>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                id={option.value}
                textValue={option.label}
              >
                {option.label}
              </Select.Item>
            ))}
          </Select.ListBox>
        </Select.Popover>
      </Select>
      <Button
        variant={ButtonVariant.GHOST}
        className="min-w-0 flex-1 gap-(--space-1) px-(--space-1) text-xs"
        aria-label={next ? `${nextLabel}: ${next.label}` : nextLabel}
        isDisabled={!next || isPending}
        onPress={() => next && selectMonth(next.value)}
        data-testid="plan-month-next"
      >
        <span className="text-pretty">{next?.shortLabel ?? nextLabel}</span>
        <AppIcon icon={ACTION_ICONS.forward} size={AppIconSize.XS} />
      </Button>
      {isPending ? (
        <span className="sr-only" role="status" aria-live="polite">
          {loadingLabel}
        </span>
      ) : null}
    </div>
  );
}
