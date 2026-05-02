"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as z from "zod";

import { addManualJarAdjustmentAction } from "@/app/jars/intent-actions";
import { Button } from "@/components/ui/button";
import { RHFInput, RHFSelect } from "@/components/ui/rhf-fields";

const adjustmentSchema = z.object({
  jarId: z.string().min(1, "Vui lòng chọn hũ"),
  movementDate: z.string().min(1, "Vui lòng chọn ngày"),
  amount: z.number().min(1, "Số tiền phải lớn hơn 0"),
  direction: z.enum(["in", "out"]),
  note: z.string().optional(),
  returnTo: z.string(),
});

type AdjustmentValues = z.infer<typeof adjustmentSchema>;

type Props = {
  jars: { id: string; name: string }[];
  month: string;
  returnTo: string;
};

export function JarManualAdjustmentForm({ jars, month, returnTo }: Props) {
  const [isPending, startTransition] = useTransition();

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
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

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
          label="Hũ"
          options={jars.map((j) => ({ label: j.name, value: j.id }))}
          required
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <RHFSelect
            name="direction"
            label="Hướng"
            options={[
              { label: "Tăng số dư", value: "in" },
              { label: "Giảm số dư", value: "out" },
            ]}
            required
          />
          <RHFInput name="movementDate" label="Ngày" type="date" required />
        </div>

        <RHFInput
          name="amount"
          label="Số tiền"
          type="number"
          min="1"
          required
        />

        <RHFInput name="note" label="Ghi chú" placeholder="Lý do điều chỉnh" />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Đang ghi nhận..." : "Ghi nhận điều chỉnh"}
        </Button>
      </form>
    </FormProvider>
  );
}
