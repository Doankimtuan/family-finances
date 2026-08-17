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
  savingsProviderInputSchema,
  savingsProductInputSchema,
} from "@/modules/savings/application/savings-domain-rules";
import { formatPercent } from "@/shared/i18n/formatters";
import { Sheet, SheetContent } from "@/shared/patterns/sheet";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { Section } from "@/shared/patterns/section";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";
import { TextField } from "@/shared/ui/form";
import { ControlledField } from "@/shared/patterns/controlled-fields";
import { LabeledSelect } from "@/shared/patterns/labeled-native-field";
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

type ProviderFormValues = import("zod").input<
  typeof savingsProviderInputSchema
>;
type ProductFormValues = import("zod").input<typeof savingsProductInputSchema>;
type ProviderEditor = { id?: string } & ProviderFormValues;
type ProductEditor = { id?: string; providerId: string } & ProductFormValues;

const DEFAULT_ICON: SavingsProviderIconKey = "bank";
const DEFAULT_CURRENCY = "VND";

function iconKeyFor(value: string | undefined): SavingsProviderIconKey {
  return value && value in SAVINGS_PROVIDER_ICONS
    ? (value as SavingsProviderIconKey)
    : DEFAULT_ICON;
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
      unit: product?.termUnit ?? "DAY",
    },
    annualInterestRatePercent: product?.annualInterestRate ?? 0,
    interestCalculationMethod: product?.interestCalculationMethod ?? "simple",
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
    <Text size="sm" weight="semibold" className="pt-(--space-2)">
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
      className="min-h-11 min-w-0 flex-1 justify-start text-left shadow-none"
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
              <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-accent-soft text-accent">
                <AppIcon
                  icon={selectedIcon}
                  size="sm"
                  label={iconLabels[value]}
                />
              </span>
              <span className="text-sm">{iconLabels[value]}</span>
            </span>
            <AppIcon icon={ACTION_ICONS.forward} size="xs" decorative />
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
                    size="sm"
                    label={iconLabels[key]}
                  />
                  <span className="text-xs">{iconLabels[key]}</span>
                  {key === value ? (
                    <span className="ml-auto text-accent">✓</span>
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
  const productValues = useWatch({ control: productForm.control });
  const productProvider = catalog.find(
    (provider) => provider.id === productValues.providerId,
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
    if (provider.isSystem || !window.confirm(t("archiveConfirm"))) return;
    startTransition(async () => {
      const result = await archiveSavingsProviderAction(provider.id);
      if (result.status === "success") {
        toast.success(t("archivedNotice"));
        router.refresh();
      } else setError(result.code);
    });
  };

  const archiveProduct = (product: SavingPackage) => {
    if (!window.confirm(t("archiveConfirm"))) return;
    startTransition(async () => {
      const result = await archiveSavingsProductAction(product.id);
      if (result.status === "success") {
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
    `${product.termAmount ?? product.durationDays} ${t(product.termUnit === "MONTH" ? "termMonth" : "termDay")}`;
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
      {error ? (
        <div
          className="rounded-[var(--radius-control)] border border-danger/30 bg-danger/5 px-(--space-3) py-(--space-2) text-sm text-danger"
          role="alert"
        >
          {tErr(error)}
        </div>
      ) : null}
      {catalog.length === 0 ? (
        <Section title={t("empty")}>
          <Text size="sm" tone="secondary">
            {t("emptyHint")}
          </Text>
        </Section>
      ) : null}
      <div className="flex flex-col gap-(--space-5)">
        {catalog.map((provider) => (
          <Section
            key={provider.id}
            testId={`savings-provider-card-${provider.id}`}
          >
            <div className="flex items-start gap-(--space-3)">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-accent-soft text-accent">
                <AppIcon
                  icon={SAVINGS_PROVIDER_ICONS[iconKeyFor(provider.iconKey)]}
                  size="md"
                  label={iconLabels[iconKeyFor(provider.iconKey)]}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-(--space-2)">
                  <div className="min-w-0">
                    <Text size="lg" weight="semibold" className="break-words">
                      {provider.displayName}
                    </Text>
                    <Text size="sm" tone="secondary" className="mt-1">
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
            <div className="mt-(--space-4) flex items-center justify-between gap-(--space-3)">
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
            <div className="mt-(--space-3) grid gap-(--space-3) sm:grid-cols-2">
              {provider.packages.length ? (
                provider.packages.map((product) => (
                  <article
                    key={product.id}
                    className="min-w-0 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-(--space-4)"
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
                        <Text size="lg" weight="semibold" className="mt-1">
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
                        onArchive={() => archiveProduct(product)}
                      />
                    </div>
                    <Text
                      size="sm"
                      tone="secondary"
                      className="mt-(--space-2) break-words"
                    >
                      {product.interestCalculationMethod === "simple"
                        ? t("simple")
                        : product.interestCalculationMethod ===
                            "compound_monthly"
                          ? t("compoundMonthly")
                          : t("compoundDaily")}
                    </Text>
                    <div className="mt-(--space-3) flex flex-wrap gap-x-(--space-3) gap-y-(--space-1) text-xs text-text-secondary">
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
                      tone="secondary"
                      className="mt-(--space-2) break-words"
                    >
                      {t("earlySummaryPrefix")}: {earlySummary(product)}
                    </Text>
                  </article>
                ))
              ) : (
                <Text size="sm" tone="secondary">
                  {t("productEmpty")}
                </Text>
              )}
            </div>
          </Section>
        ))}
      </div>

      <Sheet
        isOpen={providerEditor !== null}
        onOpenChange={(open) => {
          if (!open) closeEditors();
        }}
      >
        <SheetContent>
          {providerEditor ? (
            <>
              <Sheet.Header>
                <Sheet.Heading>
                  {providerEditor.id ? t("editProvider") : t("createProvider")}
                </Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body className="flex max-h-[70dvh] flex-col gap-(--space-4) overflow-y-auto">
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
                    <LabeledSelect
                      label={t("family")}
                      value={field.value}
                      options={[
                        { id: SavingsFamily.BANK, label: t("bank") },
                        { id: SavingsFamily.PLATFORM, label: t("platform") },
                      ]}
                      onChange={(event) => field.onChange(event.target.value)}
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
              </Sheet.Body>
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
        </SheetContent>
      </Sheet>

      <Sheet
        isOpen={productEditor !== null}
        onOpenChange={(open) => {
          if (!open) closeEditors();
        }}
      >
        <SheetContent>
          {productEditor ? (
            <>
              <Sheet.Header>
                <Sheet.Heading>
                  {productEditor.id ? t("editProduct") : t("createProduct")}
                </Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body className="flex max-h-[70dvh] flex-col gap-(--space-4) overflow-y-auto">
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
                  <LabeledSelect
                    label={t("unit")}
                    value={productValues.term?.unit ?? "DAY"}
                    options={[
                      { id: "DAY", label: t("termDay") },
                      { id: "MONTH", label: t("termMonth") },
                    ]}
                    onChange={(event) =>
                      productForm.setValue(
                        "term.unit",
                        event.target.value as "DAY" | "MONTH",
                      )
                    }
                    required
                  />
                </div>
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
                <LabeledSelect
                  label={t("method")}
                  value={productValues.interestCalculationMethod ?? "simple"}
                  options={[
                    { id: "simple", label: t("simple") },
                    { id: "compound_daily", label: t("compoundDaily") },
                    { id: "compound_monthly", label: t("compoundMonthly") },
                  ]}
                  onChange={(event) =>
                    productForm.setValue(
                      "interestCalculationMethod",
                      event.target
                        .value as ProductFormValues["interestCalculationMethod"],
                    )
                  }
                  required
                />
                <SectionLabel>{t("taxSection")}</SectionLabel>
                <div
                  className="flex flex-col gap-(--space-2)"
                  role="group"
                  aria-label={t("taxRule")}
                >
                  <div className="flex flex-col gap-(--space-2) sm:flex-row">
                    <PolicyOption
                      label={t("taxNone")}
                      selected={productValues.taxRule === SavingsTaxRule.NONE}
                      onPress={() => {
                        productForm.setValue("taxRule", SavingsTaxRule.NONE);
                        productForm.setValue("taxRatePercent", 0);
                      }}
                      testId="savings-tax-none"
                    />
                    <PolicyOption
                      label={t("taxOnInterestPolicy")}
                      description={
                        productValues.taxRule !== SavingsTaxRule.NONE
                          ? t("taxBaseHint")
                          : undefined
                      }
                      selected={
                        productValues.taxRule ===
                        SavingsTaxRule.PROFIT_PERCENTAGE
                      }
                      onPress={() => {
                        productForm.setValue(
                          "taxRule",
                          SavingsTaxRule.PROFIT_PERCENTAGE,
                        );
                        productForm.setValue(
                          "taxRatePercent",
                          productValues.taxRatePercent || taxRateDefault,
                        );
                      }}
                      testId="savings-tax-on-interest"
                    />
                  </div>
                </div>
                <AnimatePresence initial={false} mode="wait">
                  {productValues.taxRule ===
                  SavingsTaxRule.PROFIT_PERCENTAGE ? (
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
                        productValues.earlySettlementRule ===
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
                        productValues.earlySettlementRule ===
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
                        productValues.earlySettlementRule ===
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
                        productValues.earlySettlementRule ===
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
                  {productValues.earlySettlementRule ===
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
                <SectionLabel>{t("currencySection")}</SectionLabel>
                <div className="flex items-center justify-between rounded-[var(--radius-control)] border border-border-subtle bg-surface-muted px-(--space-3) py-(--space-3)">
                  <Text size="sm">{t("currency")}</Text>
                  <Text size="sm" weight="semibold">
                    {DEFAULT_CURRENCY}
                  </Text>
                </div>
              </Sheet.Body>
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
        </SheetContent>
      </Sheet>
    </div>
  );
}
