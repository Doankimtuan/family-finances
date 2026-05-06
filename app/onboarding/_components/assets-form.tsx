"use client";

import { useActionState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { addAssetOnboardingAction } from "@/app/onboarding/actions";
import {
  initialOnboardingActionState,
  type OnboardingActionState,
} from "@/app/onboarding/action-types";
import { Button } from "@/components/ui/button";
import { RHFInput, RHFMoneyInput, RHFSelect } from "@/components/ui/rhf-fields";
import { useI18n } from "@/lib/providers/i18n-provider";
import {
  ASSET_CLASS_OPTIONS,
  DEFAULTS,
  INPUT_CLASS_NAME,
  LIQUIDITY_OPTIONS,
  VALIDATION,
} from "../_lib/constants";

import { OnboardingStatusMessage } from "./onboarding-form";

const assetsFormSchema = z.object({
  name: z.string().min(VALIDATION.MIN_NAME_LENGTH),
  assetClass: z.string(),
  unitLabel: z.string().min(1),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  isLiquid: z.string(),
});

type AssetsFormValues = z.infer<typeof assetsFormSchema>;

export function AssetsForm() {
  const { t } = useI18n();
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    addAssetOnboardingAction,
    initialOnboardingActionState,
  );
  const [isPending, startTransition] = useTransition();

  const form = useForm<AssetsFormValues>({
    resolver: zodResolver(assetsFormSchema),
    defaultValues: {
      name: "",
      assetClass: "gold",
      unitLabel: DEFAULTS.UNIT_LABEL,
      quantity: DEFAULTS.QUANTITY,
      unitPrice: DEFAULTS.UNIT_PRICE,
      isLiquid: "true",
    },
  });

  const onSubmit = (data: AssetsFormValues) => {
    const fd = new FormData();
    fd.append("name", data.name);
    fd.append("assetClass", data.assetClass);
    fd.append("unitLabel", data.unitLabel);
    fd.append("quantity", String(data.quantity));
    fd.append("unitPrice", String(data.unitPrice));
    fd.append("isLiquid", data.isLiquid);
    startTransition(() => action(fd));
  };

  const assetClassOptions = ASSET_CLASS_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.label),
  }));

  const liquidityOptions = LIQUIDITY_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.label),
  }));

  return (
    <FormProvider {...form}>
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <RHFInput
          name="name"
          label={t("onboarding.assets.name")}
          required
          description={t("onboarding.assets.nameHint")}
          placeholder={t("onboarding.assets.namePlaceholder")}
          className={INPUT_CLASS_NAME}
        />

        <RHFSelect
          name="assetClass"
          label={t("onboarding.assets.class")}
          description={t("onboarding.assets.classHint")}
          options={assetClassOptions}
          className={INPUT_CLASS_NAME}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <RHFInput
          name="unitLabel"
          label={t("onboarding.assets.unitLabel")}
          className={INPUT_CLASS_NAME}
        />

        <RHFInput
          name="quantity"
          label={t("onboarding.assets.quantity")}
          type="number"
          min="0"
          step={VALIDATION.DEFAULT_QUANTITY_STEP}
          className={INPUT_CLASS_NAME}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <RHFMoneyInput
          name="unitPrice"
          label={t("onboarding.assets.unitPrice")}
          className={INPUT_CLASS_NAME}
        />

        <RHFSelect
          name="isLiquid"
          label={t("onboarding.assets.liquidity")}
          description={t("onboarding.assets.liquidityHint")}
          options={liquidityOptions}
          className={INPUT_CLASS_NAME}
        />
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
        {t("onboarding.assets.infoBanner")}
      </div>

      <Button type="submit" disabled={isPending} size="lg" className="w-full">
        {isPending ? t("common.saving") : t("onboarding.assets.submit")}
      </Button>

        <OnboardingStatusMessage state={state} />
      </form>
    </FormProvider>
  );
}
