"use client";

import { useId, useState } from "react";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { goalFundingSourceKey } from "@/modules/plan/application/goal-funding";
import {
  GOAL_FUNDING_SOURCE_TYPE_VALUES,
  GoalFundingSourceType,
} from "@/modules/plan/application/plan-constants";
import type { GoalFundingOption } from "@/modules/plan/application/queries/list-goal-funding-options";
import { formatCurrency } from "@/shared/i18n/formatters";
import { Card } from "@/shared/patterns/card";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { TextField } from "@/shared/ui/form/text-field";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";

const FUNDING_SOURCE_SEARCH_MIN = 6;

function fundingAmountKind(sourceType: GoalFundingSourceType) {
  if (sourceType === GoalFundingSourceType.INVESTMENTS) {
    return FinancialNumberKind.ESTIMATE;
  }
  return FinancialNumberKind.CURRENT_STATE;
}

function compareFundingOptions(
  left: GoalFundingOption,
  right: GoalFundingOption,
  locale: string,
) {
  const byName = left.name.localeCompare(right.name, locale, {
    sensitivity: "base",
  });
  if (byName !== 0) return byName;
  return left.currentAmount - right.currentAmount;
}

function optionMatchesQuery(
  option: GoalFundingOption,
  query: string,
  locale: string,
) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (option.name.toLowerCase().includes(needle)) return true;
  const formatted = formatCurrency(
    option.currentAmount,
    option.currency ?? DEFAULT_CURRENCY,
    locale,
    { maximumFractionDigits: 0 },
  ).toLowerCase();
  return formatted.replace(/\s/g, "").includes(needle.replace(/\s/g, ""));
}

type FundingSourceOptionRowProps = {
  option: GoalFundingOption;
  selected: boolean;
  locale: string;
  alreadyLinkedLabel: string;
  onSelect: (key: string) => void;
};

function FundingSourceOptionRow({
  option,
  selected,
  locale,
  alreadyLinkedLabel,
  onSelect,
}: FundingSourceOptionRowProps) {
  const key = goalFundingSourceKey(option);
  const unavailable = !option.isAvailable;

  return (
    <li className="min-w-0">
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        disabled={unavailable}
        data-testid={`goal-funding-option-${key}`}
        onClick={() => onSelect(key)}
        className={cn(
          "flex w-full min-w-0 items-start gap-(--space-3) px-(--space-4) py-(--space-3) text-left",
          "min-h-14 border-l-2 transition-[background-color,border-color] duration-(--duration-fast) ease-(--ease-standard)",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring",
          "motion-reduce:transition-none",
          selected
            ? "border-l-primary bg-primary-soft"
            : "border-l-transparent hover:bg-surface-hover",
          unavailable ? "cursor-not-allowed opacity-60" : null,
        )}
      >
        <span
          className={cn(
            "mt-(--space-1) flex size-5 shrink-0 items-center justify-center rounded-full border-2",
            selected
              ? "border-primary bg-primary"
              : "border-border-strong bg-transparent",
          )}
          aria-hidden
        >
          {selected ? (
            <span className="size-2 rounded-full bg-primary-fg" />
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          <Text
            as="span"
            size="base"
            weight="medium"
            className="block text-pretty text-text-primary"
          >
            {option.name}
          </Text>
          {unavailable ? (
            <Text
              as="span"
              size="sm"
              tone="secondary"
              className="mt-(--space-1) block text-pretty"
            >
              {alreadyLinkedLabel}
            </Text>
          ) : null}
        </div>
        <Text
          as="span"
          size="base"
          weight="semibold"
          tabular
          className="w-max min-w-[var(--financial-number-column-width)] shrink-0 text-right tracking-tight"
          data-financial-kind={fundingAmountKind(option.sourceType)}
        >
          <FinancialValue>
            {formatCurrency(
              option.currentAmount,
              option.currency ?? DEFAULT_CURRENCY,
              locale,
              { maximumFractionDigits: 0 },
            )}
          </FinancialValue>
        </Text>
      </button>
    </li>
  );
}

export type GoalFundingSourcePickerProps = {
  options: readonly GoalFundingOption[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  locale: string;
  alreadyLinkedLabel: string;
  groupLabel: (group: GoalFundingSourceType) => string;
  "aria-label": string;
  searchLabel?: string;
  searchPlaceholder?: string;
  noMatchesLabel?: string;
};

export function GoalFundingSourcePicker({
  options,
  selectedKey,
  onSelect,
  locale,
  alreadyLinkedLabel,
  groupLabel,
  "aria-label": ariaLabel,
  searchLabel,
  searchPlaceholder,
  noMatchesLabel,
}: GoalFundingSourcePickerProps) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const showSearch =
    Boolean(searchLabel) && options.length >= FUNDING_SOURCE_SEARCH_MIN;
  const visible = options.filter((option) =>
    optionMatchesQuery(option, query, locale),
  );

  if (options.length === 0) return null;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex w-full min-w-0 flex-col gap-(--space-4)"
      data-testid="goal-funding-source-picker"
      data-layout="stack"
    >
      {showSearch && searchLabel ? (
        <TextField
          id={searchId}
          type="search"
          label={searchLabel}
          placeholder={searchPlaceholder}
          value={query}
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          data-testid="goal-funding-source-search"
        />
      ) : null}

      {visible.length === 0 ? (
        <Text size="sm" tone="secondary" className="text-pretty">
          {noMatchesLabel}
        </Text>
      ) : (
        GOAL_FUNDING_SOURCE_TYPE_VALUES.map((group) => {
          const grouped = visible
            .filter((option) => option.sourceType === group)
            .toSorted((left, right) =>
              compareFundingOptions(left, right, locale),
            );
          if (grouped.length === 0) return null;
          return (
            <div key={group} className="flex min-w-0 flex-col gap-(--space-2)">
              <Text size="sm" weight="semibold">
                {groupLabel(group)}
              </Text>
              <Card tone="elevated" className="gap-0 overflow-hidden p-0">
                <ul className="flex w-full min-w-0 flex-col divide-y divide-border-subtle">
                  {grouped.map((option) => {
                    const optionKey = goalFundingSourceKey(option);
                    return (
                      <FundingSourceOptionRow
                        key={optionKey}
                        option={option}
                        selected={selectedKey === optionKey}
                        locale={locale}
                        alreadyLinkedLabel={alreadyLinkedLabel}
                        onSelect={onSelect}
                      />
                    );
                  })}
                </ul>
              </Card>
            </div>
          );
        })
      )}
    </div>
  );
}
