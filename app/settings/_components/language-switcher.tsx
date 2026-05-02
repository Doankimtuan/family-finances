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

const languageSchema = z.object({
  language: z.enum(["en", "vi"]),
});

type LanguageValues = z.infer<typeof languageSchema>;

import type { AppLanguage } from "@/lib/i18n/config";

export function LanguageSwitcher({
  defaultLanguage,
}: {
  defaultLanguage: AppLanguage;
}) {
  const { t, language } = useI18n();
  const vi = language === "vi";
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
        className="space-y-3"
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
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <RHFSelect
            name="language"
            label={t("settings.language")}
            options={[
              { label: t("settings.lang_en"), value: "en" },
              { label: t("settings.lang_vi"), value: "vi" },
            ]}
            className="bg-white flex-1 min-w-[140px]"
          />
          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto shrink-0 px-6 h-10 rounded-xl font-bold shadow-sm"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {vi ? "Cập nhật" : "Apply"}
          </Button>
        </div>

        <FormStatus message={state.message} status={state.status} className="text-xs" />
      </form>
    </FormProvider>
  );
}
