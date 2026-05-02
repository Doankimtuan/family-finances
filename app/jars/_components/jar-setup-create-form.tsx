"use client";

import { useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { createIntentJarAction } from "@/app/jars/intent-actions";
import { RHFInput, RHFSelect } from "@/components/ui/rhf-fields";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2, "Tên hũ phải có ít nhất 2 ký tự"),
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
          <RHFInput name="name" label="Tên hũ" placeholder="VD: Quỹ học cho con" required />
        </div>

        <RHFSelect
          name="jarType"
          label="Loại hũ"
          options={[
            { label: "Custom", value: "custom" },
            { label: "Essential", value: "essential" },
            { label: "Investment / FFA", value: "investment" },
            { label: "Long-term saving", value: "long_term_saving" },
            { label: "Education", value: "education" },
            { label: "Play", value: "play" },
            { label: "Give", value: "give" },
          ]}
          required
        />

        <RHFSelect
          name="spendPolicy"
          label="Policy sử dụng"
          options={[
            { label: "Flexible", value: "flexible" },
            { label: "Invest only", value: "invest_only" },
            { label: "Long-term only", value: "long_term_only" },
            { label: "Must spend", value: "must_spend" },
            { label: "Give only", value: "give_only" },
          ]}
          required
        />

        <RHFInput name="fixedAmount" label="Target cố định / tháng" type="number" min="0" />
        <RHFInput name="incomePercent" label="% thu nhập / tháng" type="number" min="0" max="100" step="0.01" />
        <RHFInput name="color" label="Màu" />
        <RHFInput name="icon" label="Icon" />

        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={isPending} className="rounded-xl">
            {isPending ? "Đang tạo..." : "Tạo jar"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
