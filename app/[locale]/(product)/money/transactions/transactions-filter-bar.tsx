"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  TRANSACTION_COMMON_FILTER_OPTIONS,
  TransactionFilterType,
  TRANSACTION_TAG_FILTER_QUERY_PARAM,
  TRANSACTION_TYPE_QUERY_PARAM,
} from "@/modules/ledger/application/client";
import type { TransactionTag } from "@/modules/ledger/application/client";
import { FilterChip } from "@/shared/patterns/filter-chip";
import { Text } from "@/shared/ui/text";
import { TransactionTagSelector } from "./transaction-tag-ui";

type Props = {
  type: TransactionFilterType;
  availableTags: TransactionTag[];
  selectedTagIds: string[];
};

export function TransactionsFilterBar({
  type,
  availableTags,
  selectedTagIds: initialSelectedTagIds,
}: Props) {
  const t = useTranslations("money.transactionsPage");
  const router = useRouter();
  const [selectedTagIds, setSelectedTagIds] = useState(initialSelectedTagIds);

  const apply = (
    nextType: TransactionFilterType = type,
    nextTagIds = selectedTagIds,
  ) => {
    const params = new URLSearchParams();
    if (nextType !== TransactionFilterType.ALL) {
      params.set(TRANSACTION_TYPE_QUERY_PARAM, nextType);
    }
    if (nextTagIds.length > 0) {
      params.set(TRANSACTION_TAG_FILTER_QUERY_PARAM, nextTagIds.join(","));
    }
    const query = params.toString();
    router.push(
      query
        ? `${APP_PATH.MONEY_TRANSACTIONS}?${query}`
        : APP_PATH.MONEY_TRANSACTIONS,
    );
  };

  return (
    <div
      className="flex flex-col gap-(--space-3)"
      data-testid="transactions-filter"
    >
      <fieldset>
        <legend className="sr-only">{t("filterLabel")}</legend>
        <div
          className="flex gap-(--space-2) overflow-x-auto pb-(--space-1)"
          role="group"
          aria-label={t("filterLabel")}
        >
          {TRANSACTION_COMMON_FILTER_OPTIONS.map((value) => (
            <FilterChip
              key={value}
              selected={type === value}
              onPress={() => apply(value)}
              data-testid={`transactions-filter-${value}`}
            >
              {t(`filters.${value}`)}
            </FilterChip>
          ))}
        </div>
      </fieldset>

      {type !== TransactionFilterType.ALL || selectedTagIds.length > 0 ? (
        <Link
          href={APP_PATH.MONEY_TRANSACTIONS}
          className="inline-flex min-h-11 items-center self-start text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("clearFilters")}
        </Link>
      ) : null}

      <div className="flex flex-col gap-(--space-2) border-b border-border-subtle/70 pb-(--space-2)">
        <Text size="sm" weight="medium">
          {t("tagFilterLabel")}
        </Text>
        <TransactionTagSelector
          availableTags={availableTags}
          selectedIds={selectedTagIds}
          onChange={(nextTagIds) => {
            setSelectedTagIds(nextTagIds);
            apply(type, nextTagIds);
          }}
        />
        <Link
          href={APP_PATH.MONEY_TRANSACTION_TAGS}
          className="inline-flex min-h-11 items-center self-start text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("manageTags")}
        </Link>
      </div>
    </div>
  );
}
