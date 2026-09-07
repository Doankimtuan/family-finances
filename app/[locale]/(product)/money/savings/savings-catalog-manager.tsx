"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { motionTokens } from "@/shared/motion";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { SavingCatalogProvider } from "@/modules/savings/application/savings-provider-registry";
import type { SavingPackage } from "@/modules/savings/application/savings-types";
import {
  EarlySettlementRule,
  getSavingsProductDefaults,
  SavingsFamily,
  SavingsTaxRule,
  SavingsTermUnit,
  savingsProviderInputSchema,
  savingsProductInputSchema,
} from "@/modules/savings/application/savings-domain-rules";
import { InterestCalcMethod } from "@/modules/savings/application/client";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/client";
import { formatPercent } from "@/shared/i18n/formatters";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Card } from "@/shared/patterns/card";
import { Sheet } from "@/shared/patterns/sheet";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { TextField } from "@/shared/ui/form";
import { SelectField } from "@/shared/ui/form";
import { ControlledField } from "@/shared/patterns/controlled-fields";
import { Dropdown } from "@heroui/react";
import {
  SAVINGS_PROVIDER_ICONS,
  type SavingsProviderIconKey,
  ACTION_ICONS,
} from "@/shared/ui/icon-registry";
import { toast } from "@/shared/patterns/toast";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";
import {
  archiveSavingsProductAction,
  archiveSavingsProviderAction,
  createSavingsProductAction,
  createSavingsProviderAction,
  updateSavingsProductAction,
  updateSavingsProviderAction,
} from "./provider-actions";

type Props = { catalog: SavingCatalogProvider[] };

type ArchiveTarget =
  | { kind: "provider"; id: string; name: string }
  | { kind: "product"; id: string; name: string };

type ProviderFormValues = import("zod").input<
  typeof savingsProviderInputSchema
>;
type ProductFormValues = import("zod").input<typeof savingsProductInputSchema>;
type ProviderEditor = { id?: string } & ProviderFormValues;
type ProductEditor = { id?: string; providerId: string } & ProductFormValues;

const DEFAULT_ICON: SavingsProviderIconKey = "bank";

function iconKeyFor(value: string | undefined): SavingsProviderIconKey {
  return value && value in SAVINGS_PROVIDER_ICONS
    ? (value as SavingsProviderIconKey)
    : DEFAULT_ICON;
}

function parseTermUnit(value: string): SavingsTermUnit {
  return value === SavingsTermUnit.MONTH
    ? SavingsTermUnit.MONTH
    : SavingsTermUnit.DAY;
}

function parseInterestCalcMethod(value: string): InterestCalcMethod {
  if (value === InterestCalcMethod.COMPOUND_DAILY) {
    return InterestCalcMethod.COMPOUND_DAILY;
  }
  if (value === InterestCalcMethod.COMPOUND_MONTHLY) {
    return InterestCalcMethod.COMPOUND_MONTHLY;
  }
  return InterestCalcMethod.SIMPLE;
}

function providerFormFrom(provider?: SavingCatalogProvider): ProviderEditor {
  return provider
    ? {
        id: provider.id,
        name: provider.displayName,
        family:
          provider.family === SavingsFamily.PLATFORM
            ? SavingsFamily.PLATFORM
            : SavingsFamily.BANK,
        iconKey: iconKeyFor(provider.iconKey),
      }
    : { name: "", family: SavingsFamily.BANK, iconKey: DEFAULT_ICON };
}

function productFormFrom(
  provider: SavingCatalogProvider,
  product?: SavingPackage,
): ProductEditor {
  const defaults = getSavingsProductDefaults(
    provider.family === SavingsFamily.PLATFORM
      ? SavingsFamily.PLATFORM
      : SavingsFamily.BANK,
  );
  return {
    id: product?.id,
    providerId: provider.id,
    name: product?.packageName ?? "",
    term: {
      amount: product?.termAmount ?? product?.durationDays ?? 30,
      unit: product?.termUnit ?? SavingsTermUnit.DAY,
    },
    annualInterestRatePercent: product?.annualInterestRate ?? 0,
    interestCalculationMethod:
      product?.interestCalculationMethod ?? InterestCalcMethod.SIMPLE,
    taxRule: product?.taxRule ?? defaults.taxRule,
    taxRatePercent: product?.taxRatePercent ?? defaults.taxRatePercent,
    currency: product?.currency ?? DEFAULT_CURRENCY,
    minAmount: product?.minAmount ?? null,
    maxAmount: product?.maxAmount ?? null,
    earlySettlementRule:
      product?.earlySettlementRule ?? defaults.earlySettlementRule,
    earlySettlementRatePercent:
      product?.earlySettlementRatePercent ??
      defaults.earlySettlementRatePercent,
    settlementRules: ["withdraw_everything"],
    penaltyRules: [],
    renewableAvailable: true,
    supportsPartialSettlement: false,
  };
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      size="xs"
      weight="semibold"
      className="pt-(--space-2) uppercase tracking-wide text-text-secondary"
    >
      {children}
    </Text>
  );
}

function PolicyOption({
  label,
  description,
  selected,
  onPress,
  testId,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  testId: string;
}) {
  return (
    <Button
      type="button"
      variant={selected ? "primary" : "secondary"}
      aria-pressed={selected}
      data-testid={testId}
      className="min-h-11 min-w-0 flex-1 justify-start rounded-[var(--radius-control)] text-left shadow-none transition-[background-color,border-color,transform] duration-(--duration-fast) motion-reduce:transition-none"
      onPress={onPress}
    >
      <span className="flex min-w-0 flex-col items-start gap-0.5">
        <span className="truncate text-sm font-medium">{label}</span>
        {description ? (
          <span className="text-xs opacity-75">{description}</span>
        ) : null}
      </span>
    </Button>
  );
}

function ProviderIconPicker({
  value,
  onChange,
  label,
  chooseLabel,
  iconLabels,
}: {
  value: SavingsProviderIconKey;
  onChange: (value: SavingsProviderIconKey) => void;
  label: string;
  chooseLabel: string;
  iconLabels: Record<SavingsProviderIconKey, string>;
}) {
  const [open, setOpen] = useState(false);
  const selectedIcon = SAVINGS_PROVIDER_ICONS[value];
  return (
    <div className="flex flex-col gap-(--space-2)">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <Dropdown isOpen={open} onOpenChange={setOpen}>
        <Dropdown.Trigger
          type="button"
          aria-label={chooseLabel}
          data-testid="savings-provider-icon-picker"
          className="min-h-11 w-full justify-between shadow-none"
        >
          <span className="flex w-full items-center justify-between gap-(--space-2)">
            <span className="flex items-center gap-(--space-2)">
              <IconContainer tone={IconContainerTone.SAVINGS} size="sm">
                <AppIcon
                  icon={selectedIcon}
                  size={AppIconSize.SM}
                  label={iconLabels[value]}
                />
              </IconContainer>
              <span className="text-sm">{iconLabels[value]}</span>
            </span>
            <AppIcon
              icon={ACTION_ICONS.forward}
              size={AppIconSize.XS}
              decorative
            />
          </span>
        </Dropdown.Trigger>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu
            aria-label={chooseLabel}
            className="grid grid-cols-2 gap-(--space-1) p-(--space-2)"
            onAction={(key) => {
              onChange(String(key) as SavingsProviderIconKey);
              setOpen(false);
            }}
          >
            {(
              Object.keys(SAVINGS_PROVIDER_ICONS) as SavingsProviderIconKey[]
            ).map((key) => (
              <Dropdown.Item
                id={key}
                key={key}
                textValue={iconLabels[key]}
                className="min-h-11 rounded-[var(--radius-control)] p-(--space-2) data-[focused]:bg-surface-hover"
              >
                <span className="flex items-center gap-(--space-2)">
                  <AppIcon
                    icon={SAVINGS_PROVIDER_ICONS[key]}
                    size={AppIconSize.SM}
                    label={iconLabels[key]}
                  />
                  <span className="text-xs">{iconLabels[key]}</span>
                  {key === value ? (
                    <AppIcon
                      icon={ACTION_ICONS.check}
                      size={AppIconSize.XS}
                      className="ml-auto text-accent"
                      decorative
                    />
                  ) : null}
                </span>
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}

function CompactActions({
  label,
  onEdit,
  onArchive,
  editLabel,
  archiveLabel,
}: {
  label: string;
  onEdit: () => void;
  onArchive: () => void;
  editLabel: string;
  archiveLabel: string;
}) {
  return (
    <Dropdown>
      <Dropdown.Trigger
        type="button"
        aria-label={label}
        data-testid="savings-more-actions"
        className="min-h-10 min-w-10 bg-transparent p-0 shadow-none"
      >
        <span className="flex items-center justify-center">
          <AppIcon icon={ACTION_ICONS.more} size="sm" label={label} />
        </span>
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu
          aria-label={label}
          onAction={(key) => (key === "edit" ? onEdit() : onArchive())}
        >
          <Dropdown.Item id="edit">{editLabel}</Dropdown.Item>
          <Dropdown.Item id="archive">{archiveLabel}</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export function SavingsCatalogManager({ catalog }: Props) {
  const t = useTranslations("money.savingsCatalog");
  const tErr = useTranslations("money.products.errors");
  const locale = useLocale();
  const router = useRouter();
  const [providerEditor, setProviderEditor] = useState<ProviderEditor | null>(
    null,
  );
  const [productEditor, setProductEditor] = useState<ProductEditor | null>(
    null,
  );
  const [error, setError] = useState<ProductActionErrorCode | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ArchiveTarget | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const providerForm = useForm<ProviderFormValues>({
    resolver: zodResolver(savingsProviderInputSchema),
    defaultValues: providerFormFrom(),
  });
  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(savingsProductInputSchema),
    defaultValues: productFormFrom(
      catalog[0] ?? {
        id: "",
        displayName: "",
        family: SavingsFamily.BANK,
        packages: [],
      },
    ),
  });
  const productProviderId = useWatch({
    control: productForm.control,
    name: "providerId",
  });
  const productTermUnit = useWatch({
    control: productForm.control,
    name: "term.unit",
  });
  const productInterestCalculationMethod = useWatch({
    control: productForm.control,
    name: "interestCalculationMethod",
  });
  const productTaxRule = useWatch({
    control: productForm.control,
    name: "taxRule",
  });
  const productTaxRatePercent = useWatch({
    control: productForm.control,
    name: "taxRatePercent",
  });
  const productEarlySettlementRule = useWatch({
    control: productForm.control,
    name: "earlySettlementRule",
  });
  const productProvider = catalog.find(
    (provider) => provider.id === productProviderId,
  );
  const taxRateDefault = productProvider
    ? getSavingsProductDefaults(
        productProvider.family === SavingsFamily.PLATFORM
          ? SavingsFamily.PLATFORM
          : SavingsFamily.BANK,
      ).taxRatePercent
    : 0;

  const iconLabels = Object.fromEntries(
    (Object.keys(SAVINGS_PROVIDER_ICONS) as SavingsProviderIconKey[]).map(
      (key) => [key, t(`icon.${key}`)],
    ),
  ) as Record<SavingsProviderIconKey, string>;

  const closeEditors = () => {
    setProviderEditor(null);
    setProductEditor(null);
    setError(null);
    providerForm.reset(providerFormFrom());
    if (catalog[0]) productForm.reset(productFormFrom(catalog[0]));
  };

  const submitProvider = providerForm.handleSubmit((input) => {
    setError(null);
    startTransition(async () => {
      const result = providerEditor?.id
        ? await updateSavingsProviderAction(providerEditor.id, input)
        : await createSavingsProviderAction(input);
      if (result.status === "success") {
        closeEditors();
        toast.success(t("saved"));
        router.refresh();
      } else setError(result.code);
    });
  });

  const submitProduct = productForm.handleSubmit((input) => {
    setError(null);
    startTransition(async () => {
      const result = productEditor?.id
        ? await updateSavingsProductAction(productEditor.id, input)
        : await createSavingsProductAction(input);
      if (result.status === "success") {
        closeEditors();
        toast.success(t("saved"));
        router.refresh();
      } else setError(result.code);
    });
  });

  const archiveProvider = (provider: SavingCatalogProvider) => {
    if (provider.isSystem) return;
    setArchiveTarget({
      kind: "provider",
      id: provider.id,
      name: provider.displayName,
    });
  };

  const archiveProduct = (product: SavingPackage, providerName: string) => {
    setArchiveTarget({
      kind: "product",
      id: product.id,
      name: `${providerName} · ${formatTerm(product)}`,
    });
  };

  const runArchive = () => {
    if (!archiveTarget) return;
    setError(null);
    startTransition(async () => {
      const result =
        archiveTarget.kind === "provider"
          ? await archiveSavingsProviderAction(archiveTarget.id)
          : await archiveSavingsProductAction(archiveTarget.id);
      if (result.status === "success") {
        setArchiveTarget(null);
        toast.success(t("archivedNotice"));
        router.refresh();
      } else setError(result.code);
    });
  };

  const openProduct = (
    provider: SavingCatalogProvider,
    product?: SavingPackage,
  ) => {
    setError(null);
    productForm.reset(productFormFrom(provider, product));
    setProductEditor(productFormFrom(provider, product));
  };

  const formatTerm = (product: SavingPackage) =>
    `${product.termAmount ?? product.durationDays} ${t(
      product.termUnit === SavingsTermUnit.MONTH ? "termMonth" : "termDay",
    )}`;
  const interestMethodLabel = (method: string | undefined) => {
    if (method === InterestCalcMethod.COMPOUND_MONTHLY) {
      return t("compoundMonthly");
    }
    if (method === InterestCalcMethod.COMPOUND_DAILY) {
      return t("compoundDaily");
    }
    return t("simple");
  };
  const earlySummary = (product: SavingPackage) => {
    switch (product.earlySettlementRule) {
      case EarlySettlementRule.NOT_ALLOWED:
        return t("earlyNotAllowed");
      case EarlySettlementRule.PRINCIPAL_ONLY:
        return t("earlyPrincipalOnly");
      case EarlySettlementRule.CUSTOM_INTEREST_RATE:
        return t("earlyCustomRate", {
          rate: formatPercent(
            (product.earlySettlementRatePercent ?? 0) / 100,
            locale,
            { maximumFractionDigits: 2 },
          ),
        });
      default:
        return t("earlyProductRule");
    }
  };

  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="savings-catalog-manager"
    >
      <div className="flex items-center justify-between gap-(--space-3)">
        <Text size="sm" tone="secondary">
          {t("pageHint")}
        </Text>
        <Button
          type="button"
          variant="primary"
          data-testid="savings-create-provider"
          onPress={() => {
            setError(null);
            providerForm.reset(providerFormFrom());
            setProviderEditor(providerFormFrom());
          }}
        >
          {t("createProvider")}
        </Button>
      </div>
      {error ? <StatusAlert variant="danger" title={tErr(error)} /> : null}
      {archiveTarget ? (
        <Card
          tone="warning"
          className="flex flex-col gap-(--space-3) p-(--space-4)"
          data-testid="savings-archive-confirm"
        >
          <Text size="sm" weight="semibold" className="text-pretty">
            {archiveTarget.name}
          </Text>
          <Text size="sm" tone="secondary" className="text-pretty">
            {t("archiveConfirm")}
          </Text>
          <div className="flex gap-(--space-2)">
            <Button
              type="button"
              variant="secondary"
              className="min-h-10 flex-1"
              isDisabled={isPending}
              onPress={() => setArchiveTarget(null)}
              data-testid="savings-archive-cancel"
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              className="min-h-10 flex-1"
              isDisabled={isPending}
              onPress={runArchive}
              data-testid="savings-archive-confirm-action"
            >
              {t("archive")}
            </Button>
          </div>
        </Card>
      ) : null}
      {catalog.length === 0 ? (
        <Card tone="soft" className="gap-(--space-1) p-(--space-4)">
          <Text size="sm" weight="semibold">
            {t("empty")}
          </Text>
          <Text size="sm" tone="secondary">
            {t("emptyHint")}
          </Text>
        </Card>
      ) : null}
      <div className="flex flex-col gap-(--space-5)">
        {catalog.map((provider) => (
          <section
            key={provider.id}
            className="flex flex-col gap-(--space-3)"
            data-testid={`savings-provider-card-${provider.id}`}
          >
            <div className="flex items-start gap-(--space-3)">
              <IconContainer tone={IconContainerTone.SAVINGS}>
                <AppIcon
                  icon={SAVINGS_PROVIDER_ICONS[iconKeyFor(provider.iconKey)]}
                  size={AppIconSize.MD}
                  label={iconLabels[iconKeyFor(provider.iconKey)]}
                />
              </IconContainer>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-(--space-2)">
                  <div className="min-w-0">
                    <Text size="sm" weight="semibold" className="break-words">
                      {provider.displayName}
                    </Text>
                    <Text size="xs" tone="secondary" className="mt-(--space-1)">
                      {provider.family === SavingsFamily.BANK
                        ? t("bank")
                        : t("platform")}{" "}
                      · {provider.packages.length} {t("packageCount")}
                    </Text>
                  </div>
                  <div className="flex shrink-0 items-center gap-(--space-1)">
                    {!provider.isSystem ? (
                      <CompactActions
                        label={t("moreActions")}
                        editLabel={t("edit")}
                        archiveLabel={t("archive")}
                        onEdit={() => {
                          const editor = providerFormFrom(provider);
                          providerForm.reset(editor);
                          setProviderEditor(editor);
                        }}
                        onArchive={() => archiveProvider(provider)}
                      />
                    ) : (
                      <Text size="xs" tone="secondary">
                        {t("system")}
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-(--space-3)">
              <Text size="sm" weight="medium">
                {t("productsHeading")}
              </Text>
              {!provider.isSystem ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-10 shrink-0 shadow-none"
                  data-testid={`savings-add-product-btn-${provider.id}`}
                  onPress={() => openProduct(provider)}
                >
                  {t("createProduct")}
                </Button>
              ) : null}
            </div>
            <Card tone="elevated" className="gap-0 overflow-hidden p-0">
              {provider.packages.length > 0 ? (
                <ul className="divide-y divide-divider">
                  {provider.packages.map((product) => (
                    <li key={product.id}>
                      <article
                        className="min-w-0 px-(--space-4) py-(--space-3)"
                        data-testid={`savings-product-card-${product.id}`}
                      >
                        <div className="flex items-start justify-between gap-(--space-2)">
                          <div className="min-w-0">
                            <Text
                              size="sm"
                              weight="semibold"
                              className="break-words"
                            >
                              {formatTerm(product)}
                            </Text>
                            <Text
                              size="sm"
                              weight="semibold"
                              tabular
                              className="mt-(--space-1) text-text-primary"
                            >
                              {formatPercent(
                                product.annualInterestRate / 100,
                                locale,
                                { maximumFractionDigits: 2 },
                              )}{" "}
                              / {t("yearShort")}
                            </Text>
                          </div>
                          <CompactActions
                            label={t("moreActions")}
                            editLabel={t("edit")}
                            archiveLabel={t("archive")}
                            onEdit={() => openProduct(provider, product)}
                            onArchive={() =>
                              archiveProduct(product, provider.displayName)
                            }
                          />
                        </div>
                        <Text
                          size="xs"
                          tone="secondary"
                          className="mt-(--space-2) break-words"
                        >
                          {interestMethodLabel(
                            product.interestCalculationMethod,
                          )}
                        </Text>
                        <div className="mt-(--space-2) flex flex-wrap gap-x-(--space-3) gap-y-(--space-1) text-xs text-text-secondary">
                          <span>
                            {product.taxRule === SavingsTaxRule.NONE
                              ? t("taxNone")
                              : t("taxOnInterest", {
                                  rate: formatPercent(
                                    (product.taxRatePercent ?? 0) / 100,
                                    locale,
                                    { maximumFractionDigits: 2 },
                                  ),
                                })}
                          </span>
                          <span>{product.currency ?? DEFAULT_CURRENCY}</span>
                        </div>
                        <Text
                          size="xs"
                          tone="muted"
                          className="mt-(--space-1) break-words"
                        >
                          {t("earlySummaryPrefix")}: {earlySummary(product)}
                        </Text>
                      </article>
                    </li>
                  ))}
                </ul>
              ) : (
                <Text
                  size="sm"
                  tone="secondary"
                  className="px-(--space-4) py-(--space-3)"
                >
                  {t("productEmpty")}
                </Text>
              )}
            </Card>
          </section>
        ))}
      </div>

      <Sheet
        isOpen={providerEditor !== null}
        onOpenChange={(open) => {
          if (!open) closeEditors();
        }}
      >
        <ActionSheetLayout>
          {providerEditor ? (
            <>
              <ActionSheetLayout.Header>
                <Sheet.Heading>
                  {providerEditor.id ? t("editProvider") : t("createProvider")}
                </Sheet.Heading>
              </ActionSheetLayout.Header>
              <ActionSheetLayout.Body className="flex max-h-[76dvh] flex-col gap-(--space-4)">
                <SectionLabel>{t("providerBasics")}</SectionLabel>
                <TextField
                  id="savings-provider-name"
                  label={t("providerName")}
                  registration={providerForm.register("name")}
                  error={
                    providerForm.formState.errors.name
                      ? t("validation.providerName")
                      : undefined
                  }
                  required
                />
                <Controller
                  name="family"
                  control={providerForm.control}
                  render={({ field }) => (
                    <SelectField
                      id="savings-provider-family"
                      label={t("family")}
                      value={field.value}
                      onChange={(next) => field.onChange(next)}
                      options={[
                        { id: SavingsFamily.BANK, label: t("bank") },
                        { id: SavingsFamily.PLATFORM, label: t("platform") },
                      ]}
                      required
                    />
                  )}
                />
                <Controller
                  name="iconKey"
                  control={providerForm.control}
                  render={({ field }) => (
                    <ProviderIconPicker
                      value={iconKeyFor(field.value)}
                      onChange={(iconKey) => field.onChange(iconKey)}
                      label={t("iconKey")}
                      chooseLabel={t("chooseIcon")}
                      iconLabels={iconLabels}
                    />
                  )}
                />
              </ActionSheetLayout.Body>
              <SheetActionFooter
                secondaryLabel={t("cancel")}
                primaryLabel={isPending ? t("saving") : t("save")}
                primaryTestId="savings-provider-save"
                isPending={isPending}
                onSecondary={closeEditors}
                onPrimary={submitProvider}
              />
            </>
          ) : null}
        </ActionSheetLayout>
      </Sheet>

      <Sheet
        isOpen={productEditor !== null}
        onOpenChange={(open) => {
          if (!open) closeEditors();
        }}
      >
        <ActionSheetLayout>
          {productEditor ? (
            <>
              <ActionSheetLayout.Header>
                <Sheet.Heading>
                  {productEditor.id ? t("editProduct") : t("createProduct")}
                </Sheet.Heading>
                <Text
                  size="sm"
                  tone="secondary"
                  className="mt-(--space-1) text-pretty"
                >
                  {productEditor.id
                    ? t("editProductHint")
                    : t("createProductHint")}
                </Text>
              </ActionSheetLayout.Header>
              <ActionSheetLayout.Body className="flex max-h-[76dvh] flex-col gap-(--space-4)">
                <div className="flex flex-col gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle bg-surface-muted/55 p-(--space-3)">
                  <SectionLabel>{t("basicSection")}</SectionLabel>
                  <TextField
                    id="savings-product-name"
                    label={t("productName")}
                    registration={productForm.register("name")}
                    required
                  />
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-(--space-3)">
                    <ControlledField
                      control={productForm.control}
                      field={{
                        type: "number",
                        name: "term.amount",
                        id: "savings-product-term",
                        label: t("duration"),
                        minValue: 1,
                        required: true,
                      }}
                    />
                    <SelectField
                      id="savings-product-term-unit"
                      label={t("unit")}
                      value={productTermUnit ?? SavingsTermUnit.DAY}
                      onChange={(next) =>
                        productForm.setValue("term.unit", parseTermUnit(next))
                      }
                      options={[
                        { id: SavingsTermUnit.DAY, label: t("termDay") },
                        { id: SavingsTermUnit.MONTH, label: t("termMonth") },
                      ]}
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle bg-surface-muted/55 p-(--space-3)">
                  <SectionLabel>{t("interestSection")}</SectionLabel>
                  <ControlledField
                    control={productForm.control}
                    field={{
                      type: "percentage",
                      name: "annualInterestRatePercent",
                      id: "savings-product-rate",
                      label: t("rate"),
                      required: true,
                    }}
                  />
                  <SelectField
                    id="savings-product-method"
                    label={t("method")}
                    value={
                      productInterestCalculationMethod ??
                      InterestCalcMethod.SIMPLE
                    }
                    onChange={(next) =>
                      productForm.setValue(
                        "interestCalculationMethod",
                        parseInterestCalcMethod(next),
                      )
                    }
                    options={[
                      {
                        id: InterestCalcMethod.SIMPLE,
                        label: t("simple"),
                      },
                      {
                        id: InterestCalcMethod.COMPOUND_DAILY,
                        label: t("compoundDaily"),
                      },
                      {
                        id: InterestCalcMethod.COMPOUND_MONTHLY,
                        label: t("compoundMonthly"),
                      },
                    ]}
                    required
                  />
                </div>
                <div className="flex flex-col gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle bg-surface-muted/55 p-(--space-3)">
                  <SectionLabel>{t("taxSection")}</SectionLabel>
                  <div
                    className="flex flex-col gap-(--space-2)"
                    role="group"
                    aria-label={t("taxRule")}
                  >
                    <div className="flex flex-col gap-(--space-2) sm:flex-row">
                      <PolicyOption
                        label={t("taxNone")}
                        selected={productTaxRule === SavingsTaxRule.NONE}
                        onPress={() => {
                          productForm.setValue("taxRule", SavingsTaxRule.NONE);
                          productForm.setValue("taxRatePercent", 0);
                        }}
                        testId="savings-tax-none"
                      />
                      <PolicyOption
                        label={t("taxOnInterestPolicy")}
                        description={
                          productTaxRule !== SavingsTaxRule.NONE
                            ? t("taxBaseHint")
                            : undefined
                        }
                        selected={
                          productTaxRule === SavingsTaxRule.PROFIT_PERCENTAGE
                        }
                        onPress={() => {
                          productForm.setValue(
                            "taxRule",
                            SavingsTaxRule.PROFIT_PERCENTAGE,
                          );
                          productForm.setValue(
                            "taxRatePercent",
                            productTaxRatePercent || taxRateDefault,
                          );
                        }}
                        testId="savings-tax-on-interest"
                      />
                    </div>
                  </div>
                  <AnimatePresence initial={false} mode="wait">
                    {productTaxRule === SavingsTaxRule.PROFIT_PERCENTAGE ? (
                      <motion.div
                        key="tax-rate"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: motionTokens.duration.fast }}
                      >
                        <ControlledField
                          control={productForm.control}
                          field={{
                            type: "percentage",
                            name: "taxRatePercent",
                            id: "savings-product-tax",
                            label: t("taxRate"),
                            required: true,
                          }}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
                <div className="flex flex-col gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle bg-surface-muted/55 p-(--space-3)">
                  <SectionLabel>{t("earlySection")}</SectionLabel>
                  <div
                    className="flex flex-col gap-(--space-2)"
                    role="group"
                    aria-label={t("earlyRule")}
                  >
                    <div className="flex flex-col gap-(--space-2)">
                      <PolicyOption
                        label={t("earlyNotAllowed")}
                        selected={
                          productEarlySettlementRule ===
                          EarlySettlementRule.NOT_ALLOWED
                        }
                        onPress={() => {
                          productForm.setValue(
                            "earlySettlementRule",
                            EarlySettlementRule.NOT_ALLOWED,
                          );
                          productForm.setValue(
                            "earlySettlementRatePercent",
                            null,
                          );
                        }}
                        testId="savings-early-not-allowed"
                      />
                      <PolicyOption
                        label={t("earlyPrincipalOnly")}
                        selected={
                          productEarlySettlementRule ===
                          EarlySettlementRule.PRINCIPAL_ONLY
                        }
                        onPress={() => {
                          productForm.setValue(
                            "earlySettlementRule",
                            EarlySettlementRule.PRINCIPAL_ONLY,
                          );
                          productForm.setValue(
                            "earlySettlementRatePercent",
                            null,
                          );
                        }}
                        testId="savings-early-principal-only"
                      />
                      <PolicyOption
                        label={t("earlyCustomInterest")}
                        selected={
                          productEarlySettlementRule ===
                          EarlySettlementRule.CUSTOM_INTEREST_RATE
                        }
                        onPress={() =>
                          productForm.setValue(
                            "earlySettlementRule",
                            EarlySettlementRule.CUSTOM_INTEREST_RATE,
                          )
                        }
                        testId="savings-early-custom-rate"
                      />
                      <PolicyOption
                        label={t("earlyProductRule")}
                        selected={
                          productEarlySettlementRule ===
                          EarlySettlementRule.PRODUCT_RULE
                        }
                        onPress={() => {
                          productForm.setValue(
                            "earlySettlementRule",
                            EarlySettlementRule.PRODUCT_RULE,
                          );
                          productForm.setValue(
                            "earlySettlementRatePercent",
                            null,
                          );
                        }}
                        testId="savings-early-product-rule"
                      />
                    </div>
                  </div>
                  <AnimatePresence initial={false} mode="wait">
                    {productEarlySettlementRule ===
                    EarlySettlementRule.CUSTOM_INTEREST_RATE ? (
                      <motion.div
                        key="early-rate"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: motionTokens.duration.fast }}
                      >
                        <ControlledField
                          control={productForm.control}
                          field={{
                            type: "percentage",
                            name: "earlySettlementRatePercent",
                            id: "savings-product-early-rate",
                            label: t("earlyRate"),
                            required: true,
                          }}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
                <div className="flex flex-col gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle bg-surface-muted/55 p-(--space-3)">
                  <SectionLabel>{t("currencySection")}</SectionLabel>
                  <div className="flex items-center justify-between rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-3) py-(--space-3)">
                    <Text size="sm">{t("currency")}</Text>
                    <Text size="sm" weight="semibold" tabular>
                      {DEFAULT_CURRENCY}
                    </Text>
                  </div>
                </div>
              </ActionSheetLayout.Body>
              <SheetActionFooter
                secondaryLabel={t("cancel")}
                primaryLabel={isPending ? t("saving") : t("save")}
                primaryTestId="savings-product-save"
                isPending={isPending}
                onSecondary={closeEditors}
                onPrimary={submitProduct}
              />
            </>
          ) : null}
        </ActionSheetLayout>
      </Sheet>
    </div>
  );
}
