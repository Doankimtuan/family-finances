"use client";

import { useActionState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { addIncomeExpenseOnboardingAction } from "@/app/onboarding/actions";
import {
  initialOnboardingActionState,
  type OnboardingActionState,
} from "@/app/onboarding/action-types";
import { Button } from "@/components/ui/button";
import { RHFMoneyInput } from "@/components/ui/rhf-fields";
import { useI18n } from "@/lib/providers/i18n-provider";
import { DEFAULTS, INPUT_CLASS_NAME } from "../_lib/constants";

import { OnboardingStatusMessage } from "./onboarding-form";

const incomeExpensesFormSchema = z.object({
  monthlyIncome: z.number().min(0),
  monthlyEssentials: z.number().min(0),
});

type IncomeExpensesFormValues = z.infer<typeof incomeExpensesFormSchema>;

export function IncomeExpensesForm() {
  const { t } = useI18n();
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    addIncomeExpenseOnboardingAction,
    initialOnboardingActionState,
  );
  const [isPending, startTransition] = useTransition();

  const form = useForm<IncomeExpensesFormValues>({
    resolver: zodResolver(incomeExpensesFormSchema),
    defaultValues: {
      monthlyIncome: DEFAULTS.MONTHLY_INCOME,
      monthlyEssentials: DEFAULTS.MONTHLY_ESSENTIALS,
    },
  });

  const onSubmit = (data: IncomeExpensesFormValues) => {
    const fd = new FormData();
    fd.append("monthlyIncome", String(data.monthlyIncome));
    fd.append("monthlyEssentials", String(data.monthlyEssentials));
    startTransition(() => action(fd));
  };

  return (
    <FormProvider {...form}>
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <RHFMoneyInput
          name="monthlyIncome"
          label={t("onboarding.incomeExpenses.monthlyIncome")}
          description={t("onboarding.incomeExpenses.monthlyIncomeHint")}
          className={INPUT_CLASS_NAME}
        />

        <RHFMoneyInput
          name="monthlyEssentials"
          label={t("onboarding.incomeExpenses.monthlyEssentials")}
          description={t("onboarding.incomeExpenses.monthlyEssentialsHint")}
          className={INPUT_CLASS_NAME}
        />
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
        {t("onboarding.incomeExpenses.infoBanner")}
      </div>

      <Button type="submit" disabled={isPending} size="lg" className="w-full">
        {isPending ? t("common.saving") : t("onboarding.incomeExpenses.submit")}
      </Button>

        <OnboardingStatusMessage state={state} />
      </form>
    </FormProvider>
  );
}
