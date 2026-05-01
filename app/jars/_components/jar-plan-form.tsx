"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as z from "zod";

import { upsertJarPlanAction } from "@/app/jars/intent-actions";
import { Button } from "@/components/ui/button";
import { RHFInput } from "@/components/ui/rhf-fields";

const planSchema = z.object({
  jarId: z.string().min(1),
  month: z.string().min(1),
  fixedAmount: z.coerce.number().min(0),
  incomePercent: z.coerce.number().min(0).max(100),
  returnTo: z.string(),
});

type PlanValues = z.infer<typeof planSchema>;

type Props = {
  jarId: string;
  month: string;
  defaultFixed: number;
  defaultPercent: number;
  returnTo: string;
};

export function JarPlanForm({
  jarId,
  month,
  defaultFixed,
  defaultPercent,
  returnTo,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const methods = useForm<PlanValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      jarId,
      month,
      fixedAmount: defaultFixed,
      incomePercent: defaultPercent,
      returnTo,
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = async (data: PlanValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    startTransition(async () => {
      // Note: upsertJarPlanAction is a server action that redirects
      // In a real app, we might want to handle the response differently if it doesn't redirect
      await upsertJarPlanAction(formData);
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        className="grid gap-2 rounded-2xl border border-border/60 bg-slate-50 p-4 sm:grid-cols-2 lg:min-w-[360px]"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <input type="hidden" {...methods.register("jarId")} />
        <input type="hidden" {...methods.register("month")} />
        <input type="hidden" {...methods.register("returnTo")} />

        <RHFInput
          name="fixedAmount"
          label="Số tiền tháng"
          type="number"
          min="0"
          className="bg-white"
        />

        <RHFInput
          name="incomePercent"
          label="% thu nhập"
          type="number"
          min="0"
          max="100"
          step="0.01"
          className="bg-white"
        />

        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu kế hoạch tháng"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
