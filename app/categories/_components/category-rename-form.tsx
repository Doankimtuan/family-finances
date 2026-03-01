"use client";

import { useActionState, useState, useTransition } from "react";

import { renameCategoryAction } from "@/app/categories/actions";
import {
  initialCategoryActionState,
  type CategoryActionState,
} from "@/app/categories/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, X, Check } from "lucide-react";

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
  const [state, action] = useActionState<CategoryActionState, FormData>(
    renameCategoryAction,
    initialCategoryActionState,
  );
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 rounded-lg"
      >
        {vi ? "Sửa" : "Edit"}
      </Button>
    );
  }

  return (
    <form
      className="space-y-2 w-full max-w-sm"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        <Input
          name="name"
          defaultValue={currentName}
          minLength={2}
          required
          placeholder={vi ? "Tên danh mục..." : "Category name..."}
          className="h-8 min-w-[120px] flex-1 rounded-lg text-sm"
        />
        <div className="flex items-center gap-2">
          <input
            name="color"
            type="color"
            defaultValue={currentColor ?? "#64748b"}
            className="h-8 w-10 rounded-lg cursor-pointer bg-background shrink-0"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isPending}
            className="h-8 w-8 rounded-lg shrink-0 bg-primary text-primary-foreground"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setOpen(false)}
            className="h-8 w-8 rounded-lg shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {state.status === "error" && state.message ? (
        <p className="text-xs font-medium text-rose-600">{state.message}</p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="text-xs font-medium text-emerald-600">{state.message}</p>
      ) : null}
    </form>
  );
}
