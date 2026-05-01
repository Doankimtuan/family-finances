"use client";

import { useActionState, useTransition, useEffect } from "react";
import { toast } from "sonner";

import { setCategoryActiveAction } from "@/app/categories/actions";
import {
  initialCategoryActionState,
} from "@/app/categories/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Props = {
  categoryId: string;
  currentActive: boolean;
};

export function CategoryActiveToggle({ categoryId, currentActive }: Props) {
  const { language } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState(
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

  const handleToggle = () => {
    const fd = new FormData();
    fd.append("categoryId", categoryId);
    fd.append("isActive", String(!currentActive));
    startTransition(() => action(fd));
  };

  return (
    <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1 shadow-sm">
      <Switch
        id={`active-toggle-${categoryId}`}
        checked={currentActive}
        disabled={isPending}
        onCheckedChange={handleToggle}
      />
      <Label
        htmlFor={`active-toggle-${categoryId}`}
        className="text-[10px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer select-none"
      >
        {currentActive ? (vi ? "Bật" : "Active") : vi ? "Tắt" : "Disabled"}
      </Label>
    </div>
  );
}
