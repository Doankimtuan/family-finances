"use client";

import { useActionState, useState, useTransition, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { renameCategoryAction } from "@/app/categories/actions";
import {
  initialCategoryActionState,
} from "@/app/categories/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Loader2, X, Check, Edit2 } from "lucide-react";
import { FormStatus } from "@/components/ui/form-status";
import { RHFInput, RHFColorInput } from "@/components/ui/rhf-fields";

const renameSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(2, "Category name must be at least 2 characters"),
  color: z.string(),
});

type RenameValues = z.infer<typeof renameSchema>;

type Props = {
  categoryId: string;
  currentName: string;
  currentColor: string | null;
};

export function CategoryRenameForm({
  categoryId,
  currentName,
  currentColor,
}: Props) {
  const { language } = useI18n();
  const vi = language === "vi";
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(
    renameCategoryAction,
    initialCategoryActionState,
  );
  const [isPending, startTransition] = useTransition();

  const methods = useForm<RenameValues>({
    resolver: zodResolver(renameSchema),
    defaultValues: {
      categoryId,
      name: currentName,
      color: currentColor ?? "#64748b",
    },
  });

  const { register, handleSubmit } = methods;

  useEffect(() => {
    if (state.status === "success") {
      const timer = setTimeout(() => {
        setOpen(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [state.status]);

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-8 w-8 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5"
        title={vi ? "Sửa" : "Edit"}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <FormProvider {...methods}>
      <form
        className="space-y-2 w-full max-w-sm"
        noValidate
        action={action}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(() => {
            startTransition(() => action(new FormData(e.currentTarget)));
          })(e);
        }}
      >
        <input type="hidden" {...register("categoryId")} />
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <RHFInput
            name="name"
            label={vi ? "Tên danh mục" : "Category Name"}
            hideLabel
            required
            placeholder={vi ? "Tên danh mục..." : "Category name..."}
            className="h-8 min-w-[120px] flex-1 rounded-xl text-sm border-slate-200 focus:border-primary/30"
          />
          <div className="flex items-center gap-2">
            <RHFColorInput
              name="color"
              label={vi ? "Màu sắc" : "Color"}
              hideLabel
              hideHex
              className="h-8 w-8 rounded-xl shrink-0 p-0.5 border-slate-200"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isPending}
              className="h-8 w-8 rounded-xl shrink-0 shadow-sm"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-xl shrink-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <FormStatus message={state.message} status={state.status} className="text-[10px]" />
      </form>
    </FormProvider>
  );
}
