"use client";

import { useActionState, useTransition, useEffect } from "react";
import { toast } from "sonner";

import { setCategoryActiveAction } from "@/app/categories/actions";
import {
  initialCategoryActionState,
  type CategoryActionState,
} from "@/app/categories/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Props = {
  categoryId: string;
  currentActive: boolean;
};

export function CategoryActiveToggle({ categoryId, currentActive }: Props) {
  const { language, t } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<CategoryActionState, FormData>(
    setCategoryActiveAction,
    initialCategoryActionState,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      toast.success(vi ? "Đã cập nhật trạng thái." : "Status updated.");
    } else if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state, vi]);

  return (
    <div className="flex items-center space-x-2">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          startTransition(() => action(fd));
        }}
      >
        <input type="hidden" name="categoryId" value={categoryId} />
        <input type="hidden" name="isActive" value={String(!currentActive)} />
        <Switch
          id={`active-toggle-${categoryId}`}
          checked={currentActive}
          disabled={isPending}
          onCheckedChange={() => {
            const form = document.getElementById(
              `form-${categoryId}`,
            ) as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
        />
        <button type="submit" className="hidden" id={`form-${categoryId}`} />
      </form>
      <Label
        htmlFor={`active-toggle-${categoryId}`}
        className="text-xs font-medium text-slate-500"
      >
        {currentActive ? (vi ? "Bật" : "Active") : vi ? "Tắt" : "Disabled"}
      </Label>
    </div>
  );
}
