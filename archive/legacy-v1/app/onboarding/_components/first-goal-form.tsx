"use client";

import { useActionState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { addFirstGoalOnboardingAction } from "@/app/onboarding/actions";
import {
  initialOnboardingActionState,
  type OnboardingActionState,
} from "@/app/onboarding/action-types";
import { Button } from "@/components/ui/button";
import { RHFInput, RHFMoneyInput, RHFSelect } from "@/components/ui/rhf-fields";
import { useI18n } from "@/lib/providers/i18n-provider";
import { DEFAULTS, GOAL_TYPE_OPTIONS, INPUT_CLASS_NAME, VALIDATION } from "../_lib/constants";

import { OnboardingStatusMessage } from "./onboarding-form";

const firstGoalFormSchema = z.object({
  name: z.string().min(VALIDATION.MIN_NAME_LENGTH),
  goalType: z.string(),
  targetAmount: z.number().min(0),
  targetDate: z.string().optional(),
});

type FirstGoalFormValues = z.infer<typeof firstGoalFormSchema>;

export function FirstGoalForm() {
  const { t } = useI18n();
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    addFirstGoalOnboardingAction,
    initialOnboardingActionState,
  );
  const [isPending, startTransition] = useTransition();

  const form = useForm<FirstGoalFormValues>({
    resolver: zodResolver(firstGoalFormSchema),
    defaultValues: {
      name: "",
      goalType: "emergency_fund",
      targetAmount: DEFAULTS.TARGET_AMOUNT,
      targetDate: "",
    },
  });

  const onSubmit = (data: FirstGoalFormValues) => {
    const fd = new FormData();
    fd.append("name", data.name);
    fd.append("goalType", data.goalType);
    fd.append("targetAmount", String(data.targetAmount));
    fd.append("targetDate", data.targetDate || "");
    startTransition(() => action(fd));
  };

  const goalTypeOptions = GOAL_TYPE_OPTIONS.map((opt) => ({
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
          label={t("onboarding.goals.name")}
          required
          description={t("onboarding.goals.nameHint")}
          placeholder={t("onboarding.goals.namePlaceholder")}
          className={INPUT_CLASS_NAME}
        />

        <RHFSelect
          name="goalType"
          label={t("onboarding.goals.type")}
          description={t("onboarding.goals.typeHint")}
          options={goalTypeOptions}
          className={INPUT_CLASS_NAME}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <RHFMoneyInput
          name="targetAmount"
          label={t("onboarding.goals.targetAmount")}
          className={INPUT_CLASS_NAME}
        />

        <RHFInput
          name="targetDate"
          label={t("onboarding.goals.targetDate")}
          type="date"
          className={INPUT_CLASS_NAME}
        />
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
        {t("onboarding.goals.infoBanner")}
      </div>

      <Button type="submit" disabled={isPending} size="lg" className="w-full">
        {isPending ? t("common.saving") : t("onboarding.goals.submit")}
      </Button>

        <OnboardingStatusMessage state={state} />
      </form>
    </FormProvider>
  );
}
