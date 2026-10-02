"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  SavingsFamily,
  SAVINGS_FAMILY_VALUES,
  SavingsTermUnit,
} from "@/modules/savings/application/savings-domain-rules";
import { SAVINGS_PROVIDER_CREATE_ICON_KEYS } from "@/modules/savings/application/savings-constants";
import {
  savingsProviderCreateSchema,
  savingsProviderCreateDefaults,
  type SavingsProviderCreateInput,
} from "@/modules/savings/application/savings-provider-create";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";
import { Page } from "@/shared/patterns/page";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { ControlledField } from "@/shared/patterns/controlled-fields";
import { Card } from "@/shared/patterns/card";
import { toast } from "@/shared/patterns/toast";
import { FormField, TextField, SelectField } from "@/shared/ui/form";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import {
  ACTION_ICONS,
  FINANCE_ICONS,
  SAVINGS_PROVIDER_ICONS,
  UTILITY_ICONS,
} from "@/shared/ui/icon-registry";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AlertVariant } from "@/shared/ui/alert";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";
import { saveSavingsProviderWithPackage } from "./actions";

export function SavingsProviderCreateForm() {
  const t = useTranslations("money.savingsCatalog");
  const tNew = useTranslations("money.savingsProviderCreate");
  const tError = useTranslations("money.products.errors");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<ProductActionErrorCode | null>(null);
  const [savedProviderId, setSavedProviderId] = useState<string | null>(null);
  const form = useForm<SavingsProviderCreateInput>({
    resolver: zodResolver(savingsProviderCreateSchema),
    defaultValues: savingsProviderCreateDefaults(),
    mode: "onChange",
  });
  const [name, family, iconKey, packageName] = useWatch({
    control: form.control,
    name: ["name", "family", "iconKey", "packageName"],
  });
  const validName =
    savingsProviderCreateSchema.shape.name.safeParse(name).success;
  const selectedIcon =
    SAVINGS_PROVIDER_CREATE_ICON_KEYS.find((key) => key === iconKey) ??
    SAVINGS_PROVIDER_CREATE_ICON_KEYS[0];
  const cancel = () => {
    if (isPending) return;
    form.reset(savingsProviderCreateDefaults());
    setError(null);
    router.push(APP_PATH.MONEY_SAVINGS_PROVIDERS);
  };
  const submit = form.handleSubmit((input) => {
    setError(null);
    startTransition(async () => {
      const result = await saveSavingsProviderWithPackage(
        input,
        savedProviderId,
      );
      if (!result.ok) {
        setSavedProviderId(result.providerId);
        setError(result.code);
        return;
      }
      form.reset(savingsProviderCreateDefaults());
      toast.success(t("saved"));
      router.replace(APP_PATH.MONEY_SAVINGS_PROVIDERS);
      router.refresh();
    });
  });

  return (
    <Page testId="savings-provider-create-page" contentClassName="flex-1">
      <form
        onSubmit={submit}
        noValidate
        className="flex flex-1 flex-col gap-(--space-4)"
        aria-busy={isPending}
      >
        <TopAppBar
          variant={TopAppBarVariant.FORM}
          title={t("createProvider")}
          onBack={cancel}
          backLabel={t("cancel")}
          className="-mx-(--page-gutter) border-b border-divider"
        />
        <Text size="sm" tone="secondary">
          {tNew("description")}
        </Text>
        <fieldset
          disabled={isPending}
          className="flex min-w-0 flex-col gap-(--space-4)"
        >
          <Card className="gap-(--space-3) [&_label]:text-xs [&_p]:text-xs">
            <TextField
              id="savings-provider-name"
              label={tNew("providerName")}
              registration={form.register("name")}
              description={
                <span className="text-text-secondary">{tNew("nameHint")}</span>
              }
              required
              error={
                form.formState.errors.name
                  ? t("validation.providerName")
                  : undefined
              }
              labelAccessory={
                validName ? (
                  <StatusBadge tone={StatusBadgeTone.POSITIVE}>
                    {tNew("valid")}
                  </StatusBadge>
                ) : undefined
              }
              className={validName ? "border-primary" : undefined}
            />
            <div className="border-t border-divider pt-(--space-3)">
              <FormField id="savings-provider-family" label={tNew("family")}>
                <div
                  id="savings-provider-family"
                  role="group"
                  aria-label={tNew("family")}
                  className="grid grid-cols-2 gap-(--space-2)"
                >
                  {SAVINGS_FAMILY_VALUES.map((value) => (
                    <Button
                      key={value}
                      fullWidth
                      aria-label={
                        value === SavingsFamily.BANK
                          ? tNew("bank")
                          : tNew("platform")
                      }
                      type="button"
                      variant={ButtonVariant.GHOST}
                      aria-pressed={family === value}
                      isDisabled={isPending}
                      data-testid={`savings-provider-family-${value}`}
                      className={cn(
                        "h-auto min-h-11 min-w-0 whitespace-normal rounded-(--radius-control) border px-(--space-2) py-(--space-2) text-xs shadow-none",
                        family === value
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border-subtle bg-surface-muted text-text-secondary",
                      )}
                      onPress={() =>
                        form.setValue("family", value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      leadingIcon={
                        <AppIcon
                          icon={
                            value === SavingsFamily.BANK
                              ? FINANCE_ICONS.bank
                              : FINANCE_ICONS.card
                          }
                          size={AppIconSize.SM}
                          decorative
                        />
                      }
                    >
                      {value === SavingsFamily.BANK
                        ? tNew("bank")
                        : tNew("platform")}
                    </Button>
                  ))}
                </div>
              </FormField>
            </div>
            <div className="border-t border-divider pt-(--space-3)">
              <FormField
                id="savings-provider-icon"
                label={tNew("icon")}
                description={
                  <span className="text-text-secondary">
                    {tNew("selectedIcon", {
                      icon: t(`icon.${selectedIcon}`),
                    })}
                  </span>
                }
              >
                <div
                  id="savings-provider-icon"
                  role="group"
                  aria-label={tNew("icon")}
                  className="grid grid-cols-4 gap-(--space-2)"
                >
                  {SAVINGS_PROVIDER_CREATE_ICON_KEYS.map((key) => (
                    <Button
                      key={key}
                      fullWidth
                      aria-label={t(`icon.${key}`)}
                      type="button"
                      variant={ButtonVariant.GHOST}
                      aria-pressed={iconKey === key}
                      isDisabled={isPending}
                      data-testid={`savings-provider-icon-${key}`}
                      onPress={() =>
                        form.setValue("iconKey", key, { shouldDirty: true })
                      }
                      className={cn(
                        "relative h-auto min-h-20 min-w-0 flex-col gap-(--space-2) whitespace-normal rounded-(--radius-control) border px-(--space-1) py-(--space-3) text-center text-xs shadow-none",
                        iconKey === key
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border-subtle bg-surface-muted text-text-secondary",
                      )}
                    >
                      <AppIcon
                        icon={SAVINGS_PROVIDER_ICONS[key]}
                        size={AppIconSize.MD}
                        decorative
                      />
                      {t(`icon.${key}`)}
                      {iconKey === key ? (
                        <span className="absolute right-0 top-0 rounded-full bg-primary p-(--space-1) text-primary-fg">
                          <AppIcon
                            icon={ACTION_ICONS.check}
                            size={AppIconSize.XS}
                            decorative
                          />
                        </span>
                      ) : null}
                    </Button>
                  ))}
                </div>
              </FormField>
            </div>
          </Card>
          <Card className="gap-(--space-3) [&_label]:text-xs [&_p]:text-xs">
            <div className="flex items-start justify-between gap-(--space-2)">
              <h2 className="flex items-start gap-(--space-2) text-xs font-semibold text-text-primary">
                <AppIcon
                  icon={UTILITY_ICONS.calendar}
                  size={AppIconSize.SM}
                  className="shrink-0 text-primary"
                  decorative
                />
                {tNew("packageTitle")}
              </h2>
              {packageName.trim() ? (
                <StatusBadge tone={StatusBadgeTone.POSITIVE}>
                  {tNew("included")}
                </StatusBadge>
              ) : null}
            </div>
            <Text size="sm" tone="secondary">
              {tNew("packageHint")}
            </Text>
            <TextField
              id="savings-provider-package-name"
              label={t("productName")}
              registration={form.register("packageName", {
                onChange: (event) => {
                  if (event.target.value.trim()) return;
                  const defaults = savingsProviderCreateDefaults();
                  form.setValue("term", defaults.term);
                  form.setValue(
                    "annualInterestRatePercent",
                    defaults.annualInterestRatePercent,
                  );
                  form.clearErrors(["term", "annualInterestRatePercent"]);
                },
              })}
              error={
                form.formState.errors.packageName
                  ? t("validation.productName")
                  : undefined
              }
            />
            <div className="grid grid-cols-2 items-start gap-(--space-3)">
              <div className="grid grid-cols-2 items-end gap-(--space-1)">
                <ControlledField
                  control={form.control}
                  field={{
                    type: "number",
                    name: "term.amount",
                    id: "savings-provider-package-term",
                    label: tNew("term"),
                    minValue: 1,
                    step: 1,
                    isDisabled: isPending || !packageName.trim(),
                  }}
                  getErrorMessage={() => t("validation.term")}
                />
                <Controller
                  name="term.unit"
                  control={form.control}
                  render={({ field }) => (
                    <SelectField
                      id="savings-provider-package-unit"
                      label={t("unit")}
                      labelClassName="sr-only"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      isDisabled={isPending || !packageName.trim()}
                      className="[&_button]:px-(--space-2) [&_button]:text-xs"
                      options={[
                        { id: SavingsTermUnit.MONTH, label: t("termMonth") },
                        { id: SavingsTermUnit.DAY, label: t("termDay") },
                      ]}
                    />
                  )}
                />
              </div>
              <ControlledField
                control={form.control}
                field={{
                  type: "percentage",
                  name: "annualInterestRatePercent",
                  id: "savings-provider-package-rate",
                  label: tNew("rate"),
                  isDisabled: isPending || !packageName.trim(),
                }}
                getErrorMessage={() => t("validation.rate")}
              />
            </div>
          </Card>
          <StatusAlert
            variant={AlertVariant.WARNING}
            title={tNew("householdTitle")}
            description={tNew("householdHint")}
          />
        </fieldset>
        {error ? (
          <div role="alert">
            <StatusAlert
              variant={AlertVariant.DANGER}
              title={tError(error)}
              description={savedProviderId ? tNew("packageRetry") : undefined}
            />
          </div>
        ) : null}
        <BottomActionBar className="mt-auto">
          <Button
            type="submit"
            fullWidth
            isDisabled={isPending}
            isLoading={isPending}
            data-testid="savings-provider-create-save"
            aria-label={isPending ? t("saving") : tNew("create")}
            leadingIcon={
              <AppIcon
                icon={ACTION_ICONS.add}
                size={AppIconSize.SM}
                decorative
              />
            }
          >
            {isPending ? t("saving") : tNew("create")}
          </Button>
          <Button
            type="button"
            variant={ButtonVariant.GHOST}
            fullWidth
            isDisabled={isPending}
            onPress={cancel}
          >
            {tNew("cancel")}
          </Button>
        </BottomActionBar>
      </form>
    </Page>
  );
}
