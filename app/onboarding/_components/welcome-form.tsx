"use client";

import { useActionState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { saveWelcomeAction } from "@/app/onboarding/actions";
import { initialOnboardingActionState, type OnboardingActionState } from "@/app/onboarding/action-types";
import { Button } from "@/components/ui/button";
import { RHFInput } from "@/components/ui/rhf-fields";
import { useI18n } from "@/lib/providers/i18n-provider";
import { DEFAULTS, INPUT_CLASS_NAME, VALIDATION } from "../_lib/constants";

import { OnboardingField, OnboardingStatusMessage } from "./onboarding-form";

const welcomeFormSchema = z.object({
  householdName: z.string().min(VALIDATION.MIN_HOUSEHOLD_NAME_LENGTH),
  timezone: z.string().min(1),
});

type WelcomeFormValues = z.infer<typeof welcomeFormSchema>;

export function WelcomeForm({ initialHouseholdName }: { initialHouseholdName: string }) {
  const { t } = useI18n();
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    saveWelcomeAction,
    initialOnboardingActionState,
  );
  const [isPending, startTransition] = useTransition();

  const form = useForm<WelcomeFormValues>({
    resolver: zodResolver(welcomeFormSchema),
    defaultValues: {
      householdName: initialHouseholdName,
      timezone: DEFAULTS.TIMEZONE,
    },
  });

  const onSubmit = (data: WelcomeFormValues) => {
    const fd = new FormData();
    fd.append("householdName", data.householdName);
    fd.append("timezone", data.timezone);
    startTransition(() => action(fd));
  };

  return (
    <FormProvider {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <RHFInput
          name="householdName"
          label={t("onboarding.welcome.householdName")}
          required
          description={t("onboarding.welcome.householdNameHint")}
          className={INPUT_CLASS_NAME}
        />

        <RHFInput
          name="timezone"
          label={t("onboarding.welcome.timezone")}
          description={t("onboarding.welcome.timezoneHint")}
          className={INPUT_CLASS_NAME}
          disabled
        />
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
        {t("onboarding.welcome.infoBanner")}
      </div>

      <Button type="submit" disabled={isPending} size="lg" className="w-full">
        {isPending ? t("common.saving") : t("onboarding.welcome.submit")}
      </Button>

        <OnboardingStatusMessage state={state} />
      </form>
    </FormProvider>
  );
}
