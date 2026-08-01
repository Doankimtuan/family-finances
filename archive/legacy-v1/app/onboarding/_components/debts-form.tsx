"use client";

import { useActionState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { addDebtOnboardingAction } from "@/app/onboarding/actions";
import {
  initialOnboardingActionState,
  type OnboardingActionState,
} from "@/app/onboarding/action-types";
import { Button } from "@/components/ui/button";
import { RHFInput, RHFMoneyInput, RHFSelect } from "@/components/ui/rhf-fields";
import { useI18n } from "@/lib/providers/i18n-provider";
import {
  DEFAULTS,
  DEBT_TYPE_OPTIONS,
  INPUT_CLASS_NAME,
  REPAYMENT_METHOD_OPTIONS,
  VALIDATION,
} from "../_lib/constants";
import { useAccounts } from "../_lib/hooks";

import { OnboardingStatusMessage } from "./onboarding-form";

const debtsFormSchema = z.object({
  name: z.string().min(VALIDATION.MIN_NAME_LENGTH),
  liabilityType: z.string(),
  dueDay: z.number().min(VALIDATION.MIN_DUE_DAY).max(VALIDATION.MAX_DUE_DAY),
  linkedAccountId: z.string().optional(),
  principalOriginal: z.number().min(0),
  currentOutstanding: z.number().min(0),
  annualRate: z.number().min(0),
  repaymentMethod: z.string(),
});

type DebtsFormValues = z.infer<typeof debtsFormSchema>;

export function DebtsForm() {
  const { t } = useI18n();
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    addDebtOnboardingAction,
    initialOnboardingActionState,
  );
  const [isPending, startTransition] = useTransition();
  const { data: accounts = [] } = useAccounts();

  const form = useForm<DebtsFormValues>({
    resolver: zodResolver(debtsFormSchema),
    defaultValues: {
      name: "",
      liabilityType: "mortgage",
      dueDay: 15,
      linkedAccountId: "",
      principalOriginal: DEFAULTS.PRINCIPAL,
      currentOutstanding: DEFAULTS.OUTSTANDING,
      annualRate: DEFAULTS.ANNUAL_RATE,
      repaymentMethod: "annuity",
    },
  });

  const onSubmit = (data: DebtsFormValues) => {
    const fd = new FormData();
    fd.append("name", data.name);
    fd.append("liabilityType", data.liabilityType);
    fd.append("dueDay", String(data.dueDay));
    fd.append("linkedAccountId", data.linkedAccountId || "");
    fd.append("principalOriginal", String(data.principalOriginal));
    fd.append("currentOutstanding", String(data.currentOutstanding));
    fd.append("annualRate", String(data.annualRate));
    fd.append("repaymentMethod", data.repaymentMethod);
    startTransition(() => action(fd));
  };

  const debtTypeOptions = DEBT_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.label),
  }));

  const repaymentMethodOptions = REPAYMENT_METHOD_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.label),
  }));

  const accountOptions = accounts.map((acc) => ({
    value: acc.id,
    label: `${acc.name} (${acc.type})`,
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
          label={t("onboarding.debts.name")}
          required
          description={t("onboarding.debts.nameHint")}
          placeholder={t("onboarding.debts.namePlaceholder")}
          className={INPUT_CLASS_NAME}
        />

        <RHFSelect
          name="liabilityType"
          label={t("onboarding.debts.type")}
          description={t("onboarding.debts.typeHint")}
          options={debtTypeOptions}
          className={INPUT_CLASS_NAME}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <RHFInput
          name="dueDay"
          label={t("onboarding.debts.dueDay")}
          required
          description={t("onboarding.debts.dueDayHint")}
          type="number"
          min={VALIDATION.MIN_DUE_DAY}
          max={VALIDATION.MAX_DUE_DAY}
          placeholder="15"
          className={INPUT_CLASS_NAME}
        />

        <RHFSelect
          name="linkedAccountId"
          label={t("onboarding.debts.linkedAccount")}
          description={t("onboarding.debts.linkedAccountHint")}
          options={accountOptions}
          className={INPUT_CLASS_NAME}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <RHFMoneyInput
          name="principalOriginal"
          label={t("onboarding.debts.principalOriginal")}
          className={INPUT_CLASS_NAME}
        />

        <RHFMoneyInput
          name="currentOutstanding"
          label={t("onboarding.debts.currentOutstanding")}
          className={INPUT_CLASS_NAME}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <RHFInput
          name="annualRate"
          label={t("onboarding.debts.annualRate")}
          type="number"
          min="0"
          step="0.01"
          className={INPUT_CLASS_NAME}
        />

        <RHFSelect
          name="repaymentMethod"
          label={t("onboarding.debts.repaymentMethod")}
          description={t("onboarding.debts.repaymentMethodHint")}
          options={repaymentMethodOptions}
          className={INPUT_CLASS_NAME}
        />
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
        {t("onboarding.debts.infoBanner")}
      </div>

      <Button type="submit" disabled={isPending} size="lg" className="w-full">
        {isPending ? t("common.saving") : t("onboarding.debts.submit")}
      </Button>

        <OnboardingStatusMessage state={state} />
      </form>
    </FormProvider>
  );
}
