"use client";

import { useActionState, useTransition, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { createCategoryAction } from "@/app/categories/actions";
import { initialCategoryActionState } from "@/app/categories/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { RHFInput, RHFColorInput } from "@/components/ui/rhf-fields";
import { FormStatus } from "@/components/ui/form-status";
import { Label } from "@/components/ui/label";

const categorySchema = z.object({
  kind: z.enum(["income", "expense"]),
  name: z.string().min(2, "Category name must be at least 2 characters"),
  color: z.string(),
});

type CategoryValues = z.infer<typeof categorySchema>;

export function CreateCategoryForm() {
  const { language, t } = useI18n();
  const vi = language === "vi";
  const [isPending, startTransition] = useTransition();

  const [state, action] = useActionState(
    createCategoryAction,
    initialCategoryActionState,
  );

  const methods = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      kind: "expense",
      name: "",
      color: "#ef4444",
    },
  });

  const { watch, setValue, handleSubmit, reset } = methods;
  const kind = watch("kind");

  useEffect(() => {
    if (state.status === "success") {
      const timer = setTimeout(() => {
        reset({
          kind: "expense",
          name: "",
          color: "#ef4444",
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [state.status, reset]);

  // Update color when kind changes to defaults
  useEffect(() => {
    if (kind === "expense") setValue("color", "#ef4444");
    else setValue("color", "#16a34a");
  }, [kind, setValue]);

  return (
    <FormProvider {...methods}>
      <form
        className="space-y-4"
        noValidate
        action={action}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(() => {
            startTransition(() => action(new FormData(e.currentTarget)));
          })(e);
        }}
      >
        <input type="hidden" {...methods.register("kind")} />
        
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <Button
            type="button"
            variant={kind === "expense" ? "default" : "ghost"}
            size="sm"
            onClick={() => setValue("kind", "expense")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              kind === "expense"
                ? "bg-white text-slate-900 shadow-sm hover:bg-white"
                : "text-slate-600"
            }`}
          >
            {vi ? "Chi tiêu" : "Expense"}
          </Button>
          <Button
            type="button"
            variant={kind === "income" ? "default" : "ghost"}
            size="sm"
            onClick={() => setValue("kind", "income")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              kind === "income"
                ? "bg-white text-slate-900 shadow-sm hover:bg-white"
                : "text-slate-600"
            }`}
          >
            {vi ? "Thu nhập" : "Income"}
          </Button>
        </div>

        <RHFInput
          name="name"
          label={vi ? "Tên danh mục" : "Category Name"}
          placeholder={kind === "expense" ? (vi ? "VD: Trông trẻ" : "e.g. Childcare") : (vi ? "VD: Làm tự do" : "e.g. Freelance")}
          required
          className="bg-white"
        />

        <RHFColorInput
          name="color"
          label={vi ? "Màu sắc" : "Color"}
          required
        />

        <FormStatus message={state.message} status={state.status} />

        <Button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl py-6 text-base font-semibold shadow-sm"
        >
          {isPending ? t("common.saving") : (vi ? "Tạo danh mục" : "Create Category")}
        </Button>
      </form>
    </FormProvider>
  );
}
