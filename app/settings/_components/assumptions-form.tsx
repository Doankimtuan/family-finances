"use client";

import { useActionState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { updateAssumptionsAction } from "@/app/settings/actions";
import {
  initialSettingsActionState,
} from "@/app/settings/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { RHFInput } from "@/components/ui/rhf-fields";
import { FormStatus } from "@/components/ui/form-status";
import { DEFAULT_ASSUMPTIONS } from "../constants/assumptions";

const assumptionsSchema = z.object({
  inflationAnnual: z.number().min(0).max(100),
  cashReturnAnnual: z.number().min(0).max(100),
  investmentReturnAnnual: z.number().min(0).max(100),
  propertyGrowthAnnual: z.number().min(0).max(100),
  goldGrowthAnnual: z.number().min(0).max(100),
  salaryGrowthAnnual: z.number().min(0).max(100),
});

type AssumptionsValues = z.infer<typeof assumptionsSchema>;

type AssumptionDefaults = {
  inflationAnnual: number;
  cashReturnAnnual: number;
  investmentReturnAnnual: number;
  propertyGrowthAnnual: number;
  goldGrowthAnnual: number;
  salaryGrowthAnnual: number;
};

export function AssumptionsForm({
  defaults,
}: {
  defaults: Partial<AssumptionDefaults>;
}) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(
    updateAssumptionsAction,
    initialSettingsActionState,
  );

  const methods = useForm<AssumptionsValues>({
    resolver: zodResolver(assumptionsSchema),
    defaultValues: {
      inflationAnnual: defaults.inflationAnnual ?? DEFAULT_ASSUMPTIONS.INFLATION_ANNUAL * 100,
      cashReturnAnnual: defaults.cashReturnAnnual ?? DEFAULT_ASSUMPTIONS.CASH_RETURN_ANNUAL * 100,
      investmentReturnAnnual: defaults.investmentReturnAnnual ?? DEFAULT_ASSUMPTIONS.INVESTMENT_RETURN_ANNUAL * 100,
      propertyGrowthAnnual: defaults.propertyGrowthAnnual ?? DEFAULT_ASSUMPTIONS.PROPERTY_GROWTH_ANNUAL * 100,
      goldGrowthAnnual: defaults.goldGrowthAnnual ?? DEFAULT_ASSUMPTIONS.GOLD_GROWTH_ANNUAL * 100,
      salaryGrowthAnnual: defaults.salaryGrowthAnnual ?? DEFAULT_ASSUMPTIONS.SALARY_GROWTH_ANNUAL * 100,
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    formAction(formData);
  });

  return (
    <FormProvider {...methods}>
      <form
        className="space-y-8"
        noValidate
        onSubmit={onSubmit}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <RHFInput
            name="inflationAnnual"
            label={t("settings.inflation")}
            type="number"
            inputMode="decimal"
            step="0.1"
            suffix="%"
            required
            className="bg-white font-mono"
            description={t("settings.inflation_description")}
          />
          <RHFInput
            name="salaryGrowthAnnual"
            label={t("settings.salary_growth")}
            type="number"
            inputMode="decimal"
            step="0.1"
            suffix="%"
            required
            className="bg-white font-mono"
            description={t("settings.salary_growth_description")}
          />
          <RHFInput
            name="cashReturnAnnual"
            label={t("settings.cash_return")}
            type="number"
            inputMode="decimal"
            step="0.1"
            suffix="%"
            required
            className="bg-white font-mono"
            description={t("settings.cash_return_description")}
          />
          <RHFInput
            name="investmentReturnAnnual"
            label={t("settings.investment_return")}
            type="number"
            inputMode="decimal"
            step="0.1"
            suffix="%"
            required
            className="bg-white font-mono"
            description={t("settings.investment_return_description")}
          />
          <RHFInput
            name="propertyGrowthAnnual"
            label={t("settings.property_growth")}
            type="number"
            inputMode="decimal"
            step="0.1"
            suffix="%"
            required
            className="bg-white font-mono"
            description={t("settings.property_growth_description")}
          />
          <RHFInput
            name="goldGrowthAnnual"
            label={t("settings.gold_growth")}
            type="number"
            inputMode="decimal"
            step="0.1"
            suffix="%"
            required
            className="bg-white font-mono"
            description={t("settings.gold_growth_description")}
          />
        </div>

        <FormStatus message={state.message} status={state.status} />

        <Button
          type="submit"
          disabled={state.status === "pending"}
          className="w-full rounded-xl py-6 text-base font-semibold shadow-sm"
        >
          {state.status === "pending" ? t("common.saving") : t("settings.save_assumptions")}
        </Button>
      </form>
    </FormProvider>
  );
}
