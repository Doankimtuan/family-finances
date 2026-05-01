"use client";

import { useActionState, useTransition } from "react";
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
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileForm({
  defaultFullName,
  defaultEmail,
}: {
  defaultFullName: string;
  defaultEmail: string;
}) {
  const { language, t } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState(
    updateProfileAction,
    initialSettingsActionState,
  );
  const [isPending, startTransition] = useTransition();

  const methods = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: defaultFullName,
    },
  });

  const { handleSubmit } = methods;

  return (
    <FormProvider {...methods}>
      <form
        className="space-y-6"
        noValidate
        action={action}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(() => {
            startTransition(() => action(new FormData(e.currentTarget)));
          })(e);
        }}
      >
        <RHFInput
          name="fullName"
          label={vi ? "Họ và tên" : "Full name"}
          required
          className="bg-white"
        />

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-slate-700">
            {vi ? "Email" : "Email"}
          </p>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-base text-slate-500 italic">
            {defaultEmail}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {vi ? "Email không thể thay đổi." : "Email cannot be changed."}
          </p>
        </div>

        <FormStatus message={state.message} status={state.status} />

        <Button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl py-6 text-base font-semibold shadow-sm"
        >
          {isPending ? t("common.saving") : (vi ? "Cập nhật hồ sơ" : "Update Profile")}
        </Button>
      </form>
    </FormProvider>
  );
}
