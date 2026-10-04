"use client";

import { useLocale, useTranslations } from "next-intl";
import type { LedgerAccount } from "@/modules/ledger/application/client";
import {
  SelectField,
  type SelectFieldProps,
} from "@/shared/ui/form/select-field";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { formatCurrency } from "@/shared/i18n/formatters";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import { moneyAccountVisualFor } from "../money-account-visuals";

type Props = Omit<SelectFieldProps, "options"> & {
  accounts: LedgerAccount[];
  currency: string;
  accountLabel?: (account: LedgerAccount) => string;
};

export function TransactionAccountField({
  accounts,
  currency,
  accountLabel,
  ...props
}: Props) {
  const locale = useLocale();
  const t = useTranslations("money.captureForm");
  const tCatalog = useTranslations("catalog");
  return (
    <SelectField
      {...props}
      className="gap-0"
      labelClassName="sr-only"
      triggerClassName="h-auto min-h-16 w-full rounded-none border-0 bg-transparent px-(--space-3) py-(--space-3) shadow-none focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:-outline-offset-2"
      options={accounts.map((account) => {
        const name =
          accountLabel?.(account) ??
          localizeCatalogName(tCatalog, CatalogGroup.ACCOUNTS, account.name);
        return {
          id: account.id,
          textValue: name,
          label: (
            <span className="flex w-full min-w-0 items-center gap-(--space-2)">
              <IconContainer size="sm" tone="info">
                <AppIcon
                  icon={
                    moneyAccountVisualFor(account.type, account.iconKey).icon
                  }
                  size="sm"
                />
              </IconContainer>
              <span className="flex min-w-0 flex-1 flex-col gap-(--space-1)">
                <span className="truncate text-xs font-normal text-text-secondary">
                  {props.label}
                </span>
                <span className="truncate text-sm font-semibold">{name}</span>
              </span>
              <span className="shrink-0 whitespace-nowrap text-xs font-normal tabular-nums text-text-secondary">
                <span>{t("accountBalance")}: </span>
                <FinancialValue>
                  {formatCurrency(account.balance, currency, locale, {
                    maximumFractionDigits: 0,
                  })}
                </FinancialValue>
              </span>
            </span>
          ),
        };
      })}
    />
  );
}
