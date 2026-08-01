"use client";

import { useActionState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteCategoryAction } from "@/app/categories/actions";
import { initialCategoryActionState } from "@/app/categories/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";

type Props = {
  categoryId: string;
};

export function CategoryDeleteButton({ categoryId }: Props) {
  const { language } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState(
    deleteCategoryAction,
    initialCategoryActionState,
  );
  const [isPending, startTransition] = useTransition();

  const handleDelete = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !window.confirm(
        vi
          ? "Xóa danh mục này? Hành động này không thể hoàn tác."
          : "Delete this category? This cannot be undone.",
      )
    )
      return;
    
    const fd = new FormData(event.currentTarget);
    startTransition(() => action(fd));
  };

  return (
    <form
      noValidate
      className="inline-flex flex-col items-end"
      onSubmit={handleDelete}
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      <Button
        type="submit"
        disabled={isPending}
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
        title={vi ? "Xóa" : "Delete"}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <FormStatus message={state.message} status={state.status} className="text-[10px] mt-1" />
    </form>
  );
}
