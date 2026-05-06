"use client";

import { useActionState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { inviteMemberOnboardingAction } from "@/app/onboarding/actions";
import { initialOnboardingActionState, type OnboardingActionState } from "@/app/onboarding/action-types";
import { Button } from "@/components/ui/button";
import { RHFInput } from "@/components/ui/rhf-fields";
import { useI18n } from "@/lib/providers/i18n-provider";
import { INPUT_CLASS_NAME } from "../_lib/constants";

import { OnboardingField, OnboardingStatusMessage } from "./onboarding-form";

const membersFormSchema = z.object({
  email: z.string().email(),
});

type MembersFormValues = z.infer<typeof membersFormSchema>;

export function MembersForm() {
  const { t } = useI18n();
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    inviteMemberOnboardingAction,
    initialOnboardingActionState,
  );
  const [isPending, startTransition] = useTransition();

  const form = useForm<MembersFormValues>({
    resolver: zodResolver(membersFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: MembersFormValues) => {
    const fd = new FormData();
    fd.append("email", data.email);
    startTransition(() => action(fd));
  };

  return (
    <FormProvider {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <RHFInput
        name="email"
        label={t("onboarding.members.email")}
        description={t("onboarding.members.emailHint")}
        type="email"
        placeholder={t("onboarding.members.emailPlaceholder")}
        className={INPUT_CLASS_NAME}
      />

      <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
        {t("onboarding.members.infoBanner")}
      </div>

      <Button type="submit" disabled={isPending} size="lg" className="w-full">
        {isPending ? t("onboarding.members.creatingInvite") : t("onboarding.members.submit")}
      </Button>

        <OnboardingStatusMessage state={state} />
      </form>
    </FormProvider>
  );
}
