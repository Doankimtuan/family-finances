"use client";

import { Dropdown } from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import { AppIcon, ACTION_ICONS } from "@/shared/ui";

const InvestmentMoreAction = {
  INCOME: "income",
  VALUATION: "valuation",
} as const;

export function InvestmentMoreActions({
  label,
  incomeHref,
  incomeLabel,
  valuationHref,
  valuationLabel,
}: {
  label: string;
  incomeHref: string;
  incomeLabel: string;
  valuationHref?: string;
  valuationLabel?: string;
}) {
  const router = useRouter();

  return (
    <Dropdown>
      <Dropdown.Trigger
        type="button"
        aria-label={label}
        data-testid="investment-more-actions"
        className="min-h-11 min-w-11 rounded-md bg-transparent p-0 shadow-none"
      >
        <AppIcon icon={ACTION_ICONS.more} size="sm" label={label} />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu
          aria-label={label}
          onAction={(key) => {
            if (key === InvestmentMoreAction.INCOME) {
              router.push(incomeHref);
              return;
            }
            if (key === InvestmentMoreAction.VALUATION && valuationHref) {
              router.push(valuationHref);
            }
          }}
        >
          <Dropdown.Item id={InvestmentMoreAction.INCOME}>
            {incomeLabel}
          </Dropdown.Item>
          {valuationHref && valuationLabel ? (
            <Dropdown.Item id={InvestmentMoreAction.VALUATION}>
              {valuationLabel}
            </Dropdown.Item>
          ) : null}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
