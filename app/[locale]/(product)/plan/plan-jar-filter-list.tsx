"use client";

import { useState, type ReactNode } from "react";
import {
  JarBudgetState,
  PlanHubJarFilter,
  PLAN_HUB_JAR_FILTER_VALUES,
  type PlanHubJarFilter as PlanHubJarFilterValue,
} from "@/modules/plan/application/plan-constants";
import type { JarBudgetState as JarBudgetStateValue } from "@/modules/plan/application/jar-budget";
import { FilterChip } from "@/shared/patterns/filter-chip";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import { PlanSectionTitle } from "./plan-section-title";

type PlanJarFilterItem = {
  id: string;
  sortName: string;
  budgetState?: JarBudgetStateValue;
  hasRemaining: boolean;
  content: ReactNode;
};

type Props = {
  items: PlanJarFilterItem[];
  locale: string;
  title: string;
  labels: {
    group: string;
    all: string;
    overspent: string;
    remaining: string;
    empty: string;
    sort: string;
    sortByName: string;
    restoreSort: string;
  };
};

export function PlanJarFilterList({ items, locale, title, labels }: Props) {
  const [filter, setFilter] = useState<PlanHubJarFilterValue>(
    PlanHubJarFilter.ALL,
  );
  const [sortByName, setSortByName] = useState(false);
  const overspentCount = items.filter(
    (item) => item.budgetState === JarBudgetState.OVERSPENT,
  ).length;
  const remainingCount = items.filter((item) => item.hasRemaining).length;
  const filterLabels: Record<PlanHubJarFilterValue, string> = {
    [PlanHubJarFilter.ALL]: labels.all,
    [PlanHubJarFilter.OVERSPENT]: labels.overspent,
    [PlanHubJarFilter.REMAINING]: labels.remaining,
  };
  const filterCounts: Record<PlanHubJarFilterValue, number> = {
    [PlanHubJarFilter.ALL]: items.length,
    [PlanHubJarFilter.OVERSPENT]: overspentCount,
    [PlanHubJarFilter.REMAINING]: remainingCount,
  };
  const visibleItems = items.filter((item) => {
    if (filter === PlanHubJarFilter.OVERSPENT) {
      return item.budgetState === JarBudgetState.OVERSPENT;
    }
    if (filter === PlanHubJarFilter.REMAINING) return item.hasRemaining;
    return true;
  });
  const orderedItems = sortByName
    ? [...visibleItems].sort((first, second) =>
        first.sortName.localeCompare(second.sortName, locale),
      )
    : visibleItems;

  return (
    <div className="flex flex-col gap-(--space-3)">
      <div className="flex items-center justify-between gap-(--space-2)">
        <PlanSectionTitle>
          <span className="text-xs font-semibold tracking-wider text-text-secondary uppercase">
            {title}
          </span>
        </PlanSectionTitle>
        <Button
          type="button"
          variant={ButtonVariant.GHOST}
          className="shrink-0 flex-nowrap gap-(--space-1) whitespace-nowrap text-primary"
          aria-label={sortByName ? labels.restoreSort : labels.sortByName}
          aria-pressed={sortByName}
          onPress={() => setSortByName((current) => !current)}
          trailingIcon={
            <AppIcon icon={ACTION_ICONS.sort} size={AppIconSize.XS} />
          }
          data-testid="plan-jar-sort"
        >
          {labels.sort}
        </Button>
      </div>
      <div
        role="group"
        aria-label={labels.group}
        className="flex flex-wrap gap-(--space-2)"
        data-testid="plan-jar-filters"
      >
        {PLAN_HUB_JAR_FILTER_VALUES.map((value) => (
          <FilterChip
            key={value}
            selected={filter === value}
            onPress={() => setFilter(value)}
            data-testid={`plan-jar-filter-${value}`}
          >
            {filterLabels[value]} ({filterCounts[value]})
          </FilterChip>
        ))}
      </div>
      {visibleItems.length > 0 ? (
        <ul
          className="flex flex-col gap-(--space-3)"
          data-testid="plan-jar-list"
        >
          {orderedItems.map((item) => (
            <li key={item.id}>{item.content}</li>
          ))}
        </ul>
      ) : (
        <Text size="sm" tone="secondary" className="py-(--space-3)">
          {labels.empty}
        </Text>
      )}
    </div>
  );
}
