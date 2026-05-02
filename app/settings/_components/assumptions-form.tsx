"use client";

import { useActionState, useTransition } from "react";
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
  defaults: AssumptionDefaults;
}) {
  const { language, t } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState(
    updateAssumptionsAction,
    initialSettingsActionState,
  );
  const [isPending, startTransition] = useTransition();

  const methods = useForm<AssumptionsValues>({
    resolver: zodResolver(assumptionsSchema),
    defaultValues: {
      inflationAnnual: defaults.inflationAnnual,
      cashReturnAnnual: defaults.cashReturnAnnual,
      investmentReturnAnnual: defaults.investmentReturnAnnual,
      propertyGrowthAnnual: defaults.propertyGrowthAnnual,
      goldGrowthAnnual: defaults.goldGrowthAnnual,
      salaryGrowthAnnual: defaults.salaryGrowthAnnual,
    },
  });

  const { handleSubmit } = methods;

  return (
    <FormProvider {...methods}>
      <form
        className="space-y-8"
        noValidate
        action={action}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(() => {
            startTransition(() => action(new FormData(e.currentTarget)));
          })(e);
        }}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <RHFInput
            name="inflationAnnual"
            label={vi ? "Lạm phát" : "Inflation"}
            type="number"
            inputMode="decimal"
            step="0.1"
            suffix="%"
            required
            className="bg-white font-mono"
            description={vi ? "Dùng cho lợi suất thực và sức mua." : "Used for real return and purchasing power."}
          />
          <RHFInput
            name="salaryGrowthAnnual"
            label={vi ? "Tăng trưởng thu nhập" : "Salary growth"}
            type="number"
            inputMode="decimal"
            step="0.1"
            suffix="%"
            required
            className="bg-white font-mono"
            description={vi ? "Dùng trong dự báo dòng tiền dài hạn." : "Used in long-horizon cash-flow projections."}
          />
          <RHFInput
            name="cashReturnAnnual"
            label={vi ? "Lợi suất tiền mặt" : "Cash return"}
            type="number"
            inputMode="decimal"
            step="0.1"
            suffix="%"
            required
            className="bg-white font-mono"
            description={vi ? "Tăng trưởng kỳ vọng của tiền gửi/tiền mặt." : "Savings deposit / cash account expected growth."}
          />
          <RHFInput
            name="investmentReturnAnnual"
            label={vi ? "Lợi suất đầu tư" : "Investment return"}
            type="number"
            inputMode="decimal"
            step="0.1"
            suffix="%"
            required
            className="bg-white font-mono"
            description={vi ? "Lợi suất kỳ vọng của quỹ mở/cổ phiếu." : "Mutual funds/stocks expected baseline return."}
          />
          <RHFInput
            name="propertyGrowthAnnual"
            label={vi ? "Bất động sản" : "Property growth"}
            type="number"
            inputMode="decimal"
            step="0.1"
            suffix="%"
            required
            className="bg-white font-mono"
            description={vi ? "Giả định tăng giá bất động sản." : "Land/property appreciation assumption."}
          />
          <RHFInput
            name="goldGrowthAnnual"
            label={vi ? "Vàng" : "Gold growth"}
            type="number"
            inputMode="decimal"
            step="0.1"
            suffix="%"
            required
            className="bg-white font-mono"
            description={vi ? "Dùng cho các kịch bản tài sản vàng." : "Used for gold wealth trajectory scenarios."}
          />
        </div>

        <FormStatus message={state.message} status={state.status} />

        <Button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl py-6 text-base font-semibold shadow-sm"
        >
          {isPending ? t("common.saving") : (vi ? "Lưu giả định" : "Save Assumptions")}
        </Button>
      </form>
    </FormProvider>
  );
}
