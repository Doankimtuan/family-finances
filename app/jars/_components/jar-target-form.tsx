"use client";

import { useTransition, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { upsertJarMonthlyTargetAction } from "@/app/jars/actions";
import {
  initialJarActionState,
  type JarActionState,
} from "@/app/jars/action-types";
import { RHFSelect, RHFMoneyInput } from "@/components/ui/rhf-fields";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { toast } from "sonner";

const targetSchema = z.object({
  jarId: z.string().min(1),
  month: z.string().min(1),
  targetMode: z.enum(["fixed", "percent"]),
  targetValue: z.coerce.number().min(0),
});

type TargetValues = z.infer<typeof targetSchema>;

type Props = {
  jarId: string;
  month: string;
  defaultMode: "fixed" | "percent";
  defaultValue: number;
  vi: boolean;
};

export function JarTargetForm({
  jarId,
  month,
  defaultMode,
  defaultValue,
  vi,
}: Props) {
  const [state, setState] = useState<JarActionState>(initialJarActionState);
  const [isPending, startTransition] = useTransition();

  const methods = useForm<TargetValues>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      jarId,
      month,
      targetMode: defaultMode,
      targetValue: defaultValue,
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = async (data: TargetValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    startTransition(async () => {
      const result = await upsertJarMonthlyTargetAction(state, formData);
      setState(result);
      if (result.status === "success") {
        toast.success(result.message);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        className="space-y-4"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <input type="hidden" {...methods.register("jarId")} />
        <input type="hidden" {...methods.register("month")} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <RHFSelect
            name="targetMode"
            label={vi ? "Kiểu mục tiêu" : "Target type"}
            options={[
              { label: vi ? "Số tiền cố định" : "Fixed amount", value: "fixed" },
              { label: vi ? "% thu nhập tháng" : "% monthly income", value: "percent" },
            ]}
          />

          <RHFMoneyInput
            name="targetValue"
            label={vi ? "Giá trị mục tiêu" : "Target value"}
          />
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl"
        >
          {isPending ? (vi ? "Đang lưu..." : "Saving...") : vi ? "Lưu mục tiêu" : "Save target"}
        </Button>

        <FormStatus message={state.message} status={state.status} />
      </form>
    </FormProvider>
  );
}
