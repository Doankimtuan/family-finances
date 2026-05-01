"use client";

import { useActionState, useTransition, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { updateHouseholdSettingsAction } from "@/app/settings/actions";
import {
  initialSettingsActionState,
} from "@/app/settings/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { RHFInput, RHFSelect } from "@/components/ui/rhf-fields";
import { FormStatus } from "@/components/ui/form-status";

const householdSchema = z.object({
  name: z.string().min(2, "Household name must be at least 2 characters"),
  language: z.enum(["en", "vi"]),
  timezone: z.string().min(1, "Timezone is required"),
});

type HouseholdValues = z.infer<typeof householdSchema>;

export function HouseholdSettingsForm({
  defaultName,
  defaultTimezone,
  defaultLanguage,
}: {
  defaultName: string;
  defaultTimezone: string;
  defaultLanguage: "en" | "vi";
}) {
  const { t } = useI18n();
  const [state, action] = useActionState(
    updateHouseholdSettingsAction,
    initialSettingsActionState,
  );
  const [isPending, startTransition] = useTransition();

  const methods = useForm<HouseholdValues>({
    resolver: zodResolver(householdSchema),
    defaultValues: {
      name: defaultName,
      language: defaultLanguage,
      timezone: defaultTimezone,
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
          name="name"
          label={t("settings.household_name")}
          required
          className="bg-white"
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <RHFSelect
            name="language"
            label={t("settings.language")}
            options={[
              { label: t("settings.lang_en"), value: "en" },
              { label: t("settings.lang_vi"), value: "vi" },
            ]}
            required
            className="bg-white h-12"
          />

          <RHFInput
            name="timezone"
            label={t("settings.timezone")}
            required
            className="bg-white"
          />
        </div>

        <div className="rounded-2xl border bg-slate-50/50 px-4 py-3 text-xs text-slate-500 font-medium leading-relaxed shadow-sm">
          {t("settings.base_currency_note")}
        </div>

        <FormStatus message={state.message} status={state.status} />

        <Button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl py-6 text-base font-semibold shadow-sm"
        >
          {isPending ? t("common.saving") : t("settings.save_household")}
        </Button>
      </form>
    </FormProvider>
  );
}
