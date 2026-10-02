"use client";

import { useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import {
  APP_PATH,
  PLAN_MONTH_QUERY,
} from "@/modules/tenancy/application/app-path";
import { AppIcon } from "@/shared/ui/app-icon";
import { Select } from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";
import { UTILITY_ICONS } from "@/shared/ui/icon-registry";

export type PlanPeriodOption = {
  value: string;
  label: string;
};

export function PlanPeriodSelect({
  label,
  loadingLabel,
  options,
  selectedMonth,
}: {
  label: string;
  loadingLabel: string;
  options: readonly PlanPeriodOption[];
  selectedMonth: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      aria-label={label}
      aria-busy={isPending || undefined}
      className="min-w-0 flex-1"
      selectedKey={selectedMonth}
      isDisabled={isPending || options.length < 2}
      onSelectionChange={(key) => {
        if (key == null || String(key) === selectedMonth) return;
        const month = String(key);
        startTransition(() => {
          router.replace({
            pathname: APP_PATH.PLAN,
            query: { [PLAN_MONTH_QUERY]: month },
          });
        });
      }}
      data-testid="plan-period-selector"
    >
      <Select.Trigger leadingIcon={<AppIcon icon={UTILITY_ICONS.calendar} />}>
        <Select.Value />
        {isPending ? (
          <Spinner
            className="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
        ) : null}
      </Select.Trigger>
      <Select.Popover>
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
      {isPending ? (
        <span className="sr-only" role="status" aria-live="polite">
          {loadingLabel}
        </span>
      ) : null}
    </Select>
  );
}
