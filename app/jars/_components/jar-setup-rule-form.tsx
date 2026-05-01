"use client";

import { useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { upsertExpenseRuleAction } from "@/app/jars/intent-actions";
import { RHFSelect } from "@/components/ui/rhf-fields";
import { Button } from "@/components/ui/button";

const schema = z.object({
  categoryId: z.string().min(1, "Vui lòng chọn category"),
  jarId: z.string().min(1, "Vui lòng chọn hũ"),
  returnTo: z.string(),
});

type Values = z.infer<typeof schema>;

type Props = {
  categories: { id: string; name: string }[];
  jars: { id: string; name: string }[];
  returnTo: string;
};

export function JarSetupRuleForm({ categories, jars, returnTo }: Props) {
  const [isPending, startTransition] = useTransition();

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: categories[0]?.id ?? "",
      jarId: jars[0]?.id ?? "",
      returnTo,
    },
  });

  const onSubmit = async (data: Values) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    startTransition(async () => {
      await upsertExpenseRuleAction(formData);
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]"
        noValidate
      >
        <input type="hidden" {...methods.register("returnTo")} />

        <RHFSelect
          name="categoryId"
          label="Expense category"
          options={categories.map(c => ({ label: c.name, value: c.id }))}
          required
        />

        <RHFSelect
          name="jarId"
          label="Jar"
          options={jars.map(j => ({ label: j.name, value: j.id }))}
          required
        />

        <div className="flex items-end">
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto rounded-xl">
            {isPending ? "Đang lưu..." : "Lưu rule"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
