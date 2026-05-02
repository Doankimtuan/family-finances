"use client";

import { useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useI18n } from "@/lib/providers/i18n-provider";

import { createIntentJarAction } from "@/app/jars/intent-actions";
import { RHFInput, RHFSelect } from "@/components/ui/rhf-fields";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2, "jars.validation.name_min"),
  jarType: z.string(),
  spendPolicy: z.string(),
  fixedAmount: z.number().min(0),
  incomePercent: z.number().min(0).max(100),
  color: z.string(),
  icon: z.string(),
  month: z.string(),
  returnTo: z.string(),
});

type Values = z.infer<typeof schema>;

type Props = {
  month: string;
  returnTo: string;
};

export function JarSetupCreateForm({ month, returnTo }: Props) {
  const [isPending, startTransition] = useTransition();

  const { t, language } = useI18n();

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      jarType: "custom",
      spendPolicy: "flexible",
      fixedAmount: 0,
      incomePercent: 0,
      color: "#2563EB",
      icon: "piggy-bank",
      month,
      returnTo,
    },
  });

  const onSubmit = async (data: Values) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    startTransition(async () => {
      await createIntentJarAction(formData);
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="grid gap-4 sm:grid-cols-2"
        noValidate
      >
        <input type="hidden" {...methods.register("month")} />
        <input type="hidden" {...methods.register("returnTo")} />

        <div className="sm:col-span-2">
          <RHFInput
            name="name"
            label={t("jars.field.name")}
            placeholder={t("jars.placeholder.name")}
            required
          />
        </div>

        <RHFSelect
          name="jarType"
          label={t("jars.field.jar_type")}
          options={[
            { label: t("jars.type.custom"), value: "custom" },
            { label: t("jars.type.essential"), value: "essential" },
            { label: t("jars.type.investment"), value: "investment" },
            { label: t("jars.type.long_term_saving"), value: "long_term_saving" },
            { label: t("jars.type.education"), value: "education" },
            { label: t("jars.type.play"), value: "play" },
            { label: t("jars.type.give"), value: "give" },
          ]}
          required
        />

        <RHFSelect
          name="spendPolicy"
          label={t("jars.field.spend_policy")}
          options={[
            { label: t("jars.policy.flexible"), value: "flexible" },
            { label: t("jars.policy.invest_only"), value: "invest_only" },
            { label: t("jars.policy.long_term_only"), value: "long_term_only" },
            { label: t("jars.policy.must_spend"), value: "must_spend" },
            { label: t("jars.policy.give_only"), value: "give_only" },
          ]}
          required
        />

        <RHFInput name="fixedAmount" label={t("jars.field.fixed_target")} type="number" min="0" />
        <RHFInput name="incomePercent" label={t("jars.field.income_percent")} type="number" min="0" max="100" step="0.01" />
        <RHFInput name="color" label={t("common.color")} />
        <RHFInput name="icon" label={t("common.icon")} />

        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={isPending} className="rounded-xl">
            {isPending ? t("common.processing") : t("jars.action.create")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
