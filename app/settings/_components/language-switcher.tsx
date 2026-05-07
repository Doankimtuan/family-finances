"use client";

import { useActionState, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  initialSettingsActionState,
} from "@/app/settings/action-types";
import { updateLanguagePreferenceAction } from "@/app/settings/actions";
import { useI18n } from "@/lib/providers/i18n-provider";
import { RHFSelect } from "@/components/ui/rhf-fields";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { FormStatus } from "@/components/ui/form-status";
import type { AppLanguage } from "@/lib/i18n/config";

const languageSchema = z.object({
  language: z.enum(["en", "vi"]),
});

type LanguageValues = z.infer<typeof languageSchema>;

export function LanguageSwitcher({
  defaultLanguage,
}: {
  defaultLanguage: AppLanguage;
}) {
  const { t } = useI18n();
  const [state, action] = useActionState(
    updateLanguagePreferenceAction,
    initialSettingsActionState,
  );
  const [isPending, startTransition] = useTransition();

  const methods = useForm<LanguageValues>({
    resolver: zodResolver(languageSchema),
    defaultValues: { language: defaultLanguage },
  });

  const { handleSubmit } = methods;

  return (
    <FormProvider {...methods}>
      <form
        className="space-y-4"
        noValidate
        action={action}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit((data) => {
            const formData = new FormData();
            formData.append("language", data.language);
            startTransition(() => action(formData));
          })(e);
        }}
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <RHFSelect
            name="language"
            label={t("settings.language")}
            options={[
              { label: t("settings.lang_en"), value: "en" },
              { label: t("settings.lang_vi"), value: "vi" },
            ]}
            className="h-11 min-w-0 rounded-xl bg-background"
          />
          <Button
            type="submit"
            disabled={isPending}
            className="h-11 w-full shrink-0 rounded-xl px-6 font-semibold shadow-sm sm:w-auto"
            aria-busy={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {t("settings.accept")}
          </Button>
        </div>

        <FormStatus
          message={state.message}
          status={state.status}
          className="text-xs leading-5"
        />
      </form>
    </FormProvider>
  );
}
