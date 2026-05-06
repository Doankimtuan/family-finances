"use client";

import { useActionState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { updateProfileAction } from "@/app/settings/actions";
import {
  initialSettingsActionState,
} from "@/app/settings/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { RHFInput } from "@/components/ui/rhf-fields";
import { FormStatus } from "@/components/ui/form-status";

const profileSchema = z.object({
  fullName: z.string().min(2, "validation.full_name_min"),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileForm({
  defaultFullName,
  defaultEmail,
}: {
  defaultFullName: string;
  defaultEmail: string;
}) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(
    updateProfileAction,
    initialSettingsActionState,
  );

  const methods = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: defaultFullName,
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();
    formData.append("fullName", data.fullName);
    formAction(formData);
  });

  return (
    <FormProvider {...methods}>
      <form
        className="space-y-6"
        noValidate
        onSubmit={onSubmit}
      >
        <RHFInput
          name="fullName"
          label={t("settings.full_name")}
          required
          className="bg-white"
        />

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-slate-700">
            {t("settings.email")}
          </p>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-base text-slate-500 italic">
            {defaultEmail}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {t("settings.email_readonly")}
          </p>
        </div>

        <FormStatus message={state.message} status={state.status} />

        <Button
          type="submit"
          disabled={state.status === "pending"}
          className="w-full rounded-xl py-6 text-base font-semibold shadow-sm"
        >
          {state.status === "pending" ? t("common.saving") : t("settings.update_profile")}
        </Button>
      </form>
    </FormProvider>
  );
}
