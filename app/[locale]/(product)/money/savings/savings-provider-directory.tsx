"use client";

import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { SavingCatalogProvider } from "@/modules/savings/application/savings-provider-registry";
import type { SavingsProviderDirectoryModel } from "@/modules/savings/application/savings-provider-directory";
import { SavingsFamily } from "@/modules/savings/application/savings-domain-rules";
import { formatCurrency } from "@/shared/i18n/formatters";
import { Card } from "@/shared/patterns/card";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Button } from "@/shared/ui/button";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import {
  ACTION_ICONS,
  UTILITY_ICONS,
  SAVINGS_PROVIDER_ICONS,
  type SavingsProviderIconKey,
} from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";

type Props = {
  model: SavingsProviderDirectoryModel;
  onCreate: () => void;
  onEdit: (provider: SavingCatalogProvider) => void;
  onArchive: (provider: SavingCatalogProvider) => void;
  renderProducts: (provider: SavingCatalogProvider) => ReactNode;
  iconKeyFor: (key: string | undefined) => SavingsProviderIconKey;
};

export function SavingsProviderDirectory({
  model,
  onCreate,
  onEdit,
  onArchive,
  renderProducts,
  iconKeyFor,
}: Props) {
  const t = useTranslations("money.savingsCatalog");
  const locale = useLocale();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const groups = [
    { title: t("bankGroup"), hint: t("bankGroupHint"), rows: model.banks },
    {
      title: t("platformGroup"),
      hint: t("platformGroupHint"),
      rows: model.platforms,
    },
    { title: t("customGroup"), hint: t("customGroupHint"), rows: model.custom },
  ];

  return (
    <>
      <Card
        tone="elevated"
        className="gap-(--space-3) p-(--space-4)"
        data-testid="savings-provider-summary"
      >
        <div className="flex items-start justify-between gap-(--space-3)">
          <div className="min-w-0">
            <Text
              size="xs"
              weight="semibold"
              className="flex items-center gap-(--space-1) text-success uppercase"
            >
              <AppIcon
                icon={ACTION_ICONS.check}
                size={AppIconSize.XS}
                decorative
              />
              {t("catalogReady")}
            </Text>
            <h2 className="mt-(--space-1) text-base font-semibold text-text-primary">
              {t("providerTotal", { count: model.providerCount })}
            </h2>
            <Text size="xs" tone="secondary" className="mt-(--space-1)">
              {t("groupBreakdown", {
                banks: model.banks.length,
                platforms: model.platforms.length,
                custom: model.custom.length,
              })}
            </Text>
          </div>
          <div className="shrink-0 rounded-(--radius-control) border border-primary/20 bg-primary-soft px-(--space-3) py-(--space-2) text-center text-primary">
            <p className="text-lg font-semibold tabular-nums">
              {t("packageTotal", { count: model.packageCount })}
            </p>
            <p className="text-xs">{t("availableTerms")}</p>
          </div>
        </div>
        <div className="flex items-start gap-(--space-2) rounded-(--radius-control) border border-border-subtle bg-surface-muted p-(--space-3)">
          <AppIcon
            icon={UTILITY_ICONS.info}
            size={AppIconSize.SM}
            className="shrink-0 text-primary"
            decorative
          />
          <Text size="xs" tone="secondary">
            {t("systemHint")}
          </Text>
        </div>
      </Card>
      {!model.balancesAvailable ? (
        <Text size="sm" tone="secondary" role="status">
          {t("balancesUnavailable")}
        </Text>
      ) : null}
      {groups
        .filter(({ rows }) => rows.length > 0)
        .map(({ title, hint, rows }) => (
          <section key={title} className="flex flex-col gap-(--space-2)">
            <div className="flex items-start justify-between gap-(--space-2)">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {title} ({rows.length})
              </h2>
              <Text size="xs" tone="secondary" className="shrink-0">
                {hint}
              </Text>
            </div>
            <Card tone="elevated" className="gap-0 overflow-hidden p-0">
              <ul className="divide-y divide-divider">
                {rows.map(({ provider, savingCount, balances }) => (
                  <li
                    key={provider.id}
                    data-testid={`savings-provider-card-${provider.id}`}
                  >
                    <div className="flex items-center gap-(--space-2) px-(--space-3) py-(--space-2)">
                      <IconContainer
                        tone={
                          provider.isSystem
                            ? IconContainerTone.SAVINGS
                            : IconContainerTone.PRIMARY
                        }
                        size="sm"
                      >
                        <AppIcon
                          icon={
                            SAVINGS_PROVIDER_ICONS[iconKeyFor(provider.iconKey)]
                          }
                          size={AppIconSize.SM}
                          decorative
                        />
                      </IconContainer>
                      <Button
                        variant="ghost"
                        className="h-auto min-h-11 min-w-0 flex-1 justify-between gap-(--space-2) rounded-(--radius-control) px-0 text-left shadow-none"
                        aria-expanded={expandedId === provider.id}
                        aria-controls={`provider-products-${provider.id}`}
                        onPress={() =>
                          setExpandedId(
                            expandedId === provider.id ? null : provider.id,
                          )
                        }
                        data-testid={`savings-provider-open-${provider.id}`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-(--space-1)">
                            <span className="truncate text-sm font-semibold text-text-primary">
                              {provider.displayName}
                            </span>
                            <span className="rounded-(--radius-sm) bg-surface-muted px-(--space-1) text-xs text-text-secondary">
                              {provider.isSystem
                                ? t("systemBadge")
                                : t("customBadge")}
                            </span>
                          </span>
                          <span className="block text-xs text-text-secondary">
                            {t("packageTotal", {
                              count: provider.packages.length,
                            })}{" "}
                            ·{" "}
                            {provider.family === SavingsFamily.BANK
                              ? t("bank")
                              : t("platform")}
                          </span>
                          {!provider.isSystem && model.balancesAvailable ? (
                            <span className="block text-xs text-text-secondary">
                              {t("savingCount", { count: savingCount })}
                            </span>
                          ) : null}
                        </span>
                        {provider.isSystem && model.balancesAvailable ? (
                          <span className="shrink-0 text-right">
                            {balances.map(({ currency, amount }) => (
                              <FinancialValue
                                key={currency}
                                className="block text-xs font-medium text-text-primary"
                              >
                                {formatCurrency(amount, currency, locale)}
                              </FinancialValue>
                            ))}
                            <span className="block text-xs text-success">
                              {t("savingCount", { count: savingCount })}
                            </span>
                          </span>
                        ) : null}
                        <AppIcon
                          icon={
                            expandedId === provider.id
                              ? ACTION_ICONS.expand
                              : ACTION_ICONS.forward
                          }
                          size={AppIconSize.XS}
                          decorative
                        />
                      </Button>
                      {!provider.isSystem ? (
                        <div className="flex shrink-0 gap-(--space-1)">
                          <Button
                            variant="flat"
                            size="sm"
                            aria-label={t("editProviderNamed", {
                              name: provider.displayName,
                            })}
                            onPress={() => onEdit(provider)}
                            leadingIcon={
                              <AppIcon
                                icon={ACTION_ICONS.edit}
                                size={AppIconSize.XS}
                                decorative
                              />
                            }
                          >
                            {t("editShort")}
                          </Button>
                          <Button
                            variant="outlined"
                            size="sm"
                            className="border-danger/20 bg-danger-soft text-danger"
                            aria-label={t("archiveProviderNamed", {
                              name: provider.displayName,
                            })}
                            onPress={() => onArchive(provider)}
                          >
                            {t("archive")}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    <div
                      id={`provider-products-${provider.id}`}
                      hidden={expandedId !== provider.id}
                      className="border-t border-divider bg-surface-muted/30 p-(--space-3)"
                    >
                      {expandedId === provider.id
                        ? renderProducts(provider)
                        : null}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}
      {model.providerCount === 0 ? (
        <Card tone="soft" className="p-(--space-4)">
          <Text weight="semibold">{t("empty")}</Text>
          <Text size="sm" tone="secondary">
            {t("emptyHint")}
          </Text>
        </Card>
      ) : null}
      <Text
        size="xs"
        tone="secondary"
        className="flex items-center justify-center gap-(--space-2) text-center"
      >
        <AppIcon icon={UTILITY_ICONS.shield} size={AppIconSize.XS} decorative />
        {t("historyHint")}
      </Text>
      <BottomActionBar className="mt-auto">
        <Button
          fullWidth
          data-testid="savings-create-provider"
          onPress={onCreate}
          leadingIcon={
            <AppIcon icon={ACTION_ICONS.add} size={AppIconSize.SM} decorative />
          }
        >
          {t("createProvider")}
        </Button>
      </BottomActionBar>
    </>
  );
}
