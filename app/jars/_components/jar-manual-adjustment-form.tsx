"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as z from "zod";

import { addManualJarAdjustmentAction } from "@/app/jars/intent-actions";
import { Button } from "@/components/ui/button";
import { RHFInput, RHFSelect } from "@/components/ui/rhf-fields";
import { useI18n } from "@/lib/providers/i18n-provider";
import { objectToFormData } from "../_lib/form-helpers";

const adjustmentSchema = z.object({
  jarId: z.string().min(1, "jars.validation.jar_id_required"),
  movementDate: z.string().min(1, "common.validation.select_date"),
  amount: z.number().min(1, "common.validation.amount_positive"),
  direction: z.enum(["in", "out"]),
  note: z.string().optional(),
  returnTo: z.string().min(1, "common.validation.required"),
});

type AdjustmentValues = z.infer<typeof adjustmentSchema>;

type Props = {
  jars: { id: string; name: string }[];
  month: string;
  returnTo: string;
};

export function JarManualAdjustmentForm({ jars, month, returnTo }: Props) {
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  const methods = useForm<AdjustmentValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      jarId: jars[0]?.id ?? "",
      movementDate: new Date().toISOString().slice(0, 10),
      amount: 0,
      direction: "in",
      note: "",
      returnTo,
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = async (data: AdjustmentValues) => {
    const formData = objectToFormData(data);

    startTransition(async () => {
      await addManualJarAdjustmentAction(formData);
    });
  };

  return (
    <FormProvider {...methods}>
      <form className="space-y-3" noValidate onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...methods.register("returnTo")} />

        <RHFSelect
          name="jarId"
          label={t("jars.field.jar")}
          options={jars.map((j) => ({ label: j.name, value: j.id }))}
          required
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <RHFSelect
            name="direction"
            label={t("jars.field.direction")}
            options={[
              { label: t("jars.direction.in"), value: "in" },
              { label: t("jars.direction.out"), value: "out" },
            ]}
            required
          />
          <RHFInput name="movementDate" label={t("common.date")} type="date" required />
        </div>

        <RHFInput
          name="amount"
          label={t("common.amount")}
          type="number"
          min="1"
          required
        />

        <RHFInput name="note" label={t("common.note")} placeholder={t("jars.placeholder.adjustment_note")} />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("common.processing") : t("jars.action.record_adjustment")}
        </Button>
      </form>
    </FormProvider>
  );
}
